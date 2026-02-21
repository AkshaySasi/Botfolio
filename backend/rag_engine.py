import os
import io
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.embeddings import Embeddings
from langchain_community.vectorstores import FAISS
import httpx

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment!")
else:
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
    logger.info("Gemini API key loaded successfully.")

MODEL_NAME = "gemini-2.5-flash"
EMBEDDING_MODEL = "text-embedding-004"

# Try multiple endpoints — different API versions have different model availability
_ENDPOINTS = [
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent",
    "https://generativelanguage.googleapis.com/v1/models/{model}:embedContent",
]
_BATCH_ENDPOINTS = [
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents",
    "https://generativelanguage.googleapis.com/v1/models/{model}:batchEmbedContents",
]


class GeminiEmbeddings(Embeddings):
    """
    Embeddings via Gemini REST API.
    Tries v1beta then v1 endpoints, using x-goog-api-key header (never in URL)
    to prevent key leakage in logs.
    """
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        self._api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self._model = model_name
        self._headers = {
            "x-goog-api-key": self._api_key,
            "Content-Type": "application/json",
        }

    def _embed_one(self, text: str) -> list:
        """Try each embedContent endpoint until one works."""
        payload = {"content": {"parts": [{"text": text}]}}
        last_err = None
        for url_tmpl in _ENDPOINTS:
            url = url_tmpl.format(model=self._model)
            try:
                resp = httpx.post(url, headers=self._headers, json=payload, timeout=30)
                resp.raise_for_status()
                return resp.json()["embedding"]["values"]
            except Exception as e:
                last_err = e
                logger.warning(f"embedContent failed at {url}: {e}")
        raise RuntimeError(f"All embedContent endpoints failed: {last_err}")

    def embed_documents(self, texts: list) -> list:
        """Try batch embed, fall back to single embeds."""
        if not texts:
            return []
        last_err = None
        for url_tmpl in _BATCH_ENDPOINTS:
            url = url_tmpl.format(model=self._model)
            try:
                requests_payload = [
                    {"model": f"models/{self._model}",
                     "content": {"parts": [{"text": t}]}}
                    for t in texts
                ]
                resp = httpx.post(
                    url, headers=self._headers,
                    json={"requests": requests_payload}, timeout=60
                )
                resp.raise_for_status()
                return [e["values"] for e in resp.json()["embeddings"]]
            except Exception as e:
                last_err = e
                logger.warning(f"batchEmbedContents failed at {url}: {e}")
        # Last resort: embed one at a time
        logger.warning(f"All batch endpoints failed ({last_err}), embedding one-by-one")
        return [self._embed_one(t) for t in texts]

    def embed_query(self, text: str) -> list:
        return self._embed_one(text)

# In-memory cache mapping portfolio_id -> rag_chain
rag_chains = {}

# Local cache dir for vector stores (populated from Supabase Storage when needed)
VECTOR_CACHE_DIR = ROOT_DIR / "vector_cache"
VECTOR_CACHE_DIR.mkdir(exist_ok=True)

STORAGE_INDEXES_BUCKET = "portfolio-indexes"


def _get_supabase_admin():
    """Lazy import supabase admin client (service_role) to avoid circular imports."""
    from supabase_client import supabase_admin
    return supabase_admin


def _save_faiss_to_storage(portfolio_id: str, vectorstore: FAISS):
    """Save FAISS index files to Supabase Storage."""
    tmp_dir = tempfile.mkdtemp()
    try:
        vectorstore.save_local(tmp_dir)
        supabase_admin = _get_supabase_admin()
        for fname in ["index.faiss", "index.pkl"]:
            fpath = os.path.join(tmp_dir, fname)
            if os.path.exists(fpath):
                with open(fpath, "rb") as f:
                    data = f.read()
                storage_path = f"{portfolio_id}/{fname}"
                supabase_admin.storage.from_(STORAGE_INDEXES_BUCKET).upload(
                    storage_path, data, {"upsert": "true"}
                )
        logger.info(f"FAISS index saved to Supabase Storage for {portfolio_id}")
    except Exception as e:
        logger.error(f"Failed to save FAISS index to Storage: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _load_faiss_from_storage(portfolio_id: str, embeddings) -> Optional[FAISS]:
    """Download FAISS index files from Supabase Storage and load locally."""
    tmp_dir = tempfile.mkdtemp()
    try:
        supabase_admin = _get_supabase_admin()
        for fname in ["index.faiss", "index.pkl"]:
            storage_path = f"{portfolio_id}/{fname}"
            file_bytes = supabase_admin.storage.from_(STORAGE_INDEXES_BUCKET).download(storage_path)
            with open(os.path.join(tmp_dir, fname), "wb") as f:
                f.write(file_bytes)
        vectorstore = FAISS.load_local(tmp_dir, embeddings, allow_dangerous_deserialization=True)
        logger.info(f"FAISS index loaded from Supabase Storage for {portfolio_id}")
        return vectorstore
    except Exception as e:
        logger.warning(f"Could not load FAISS from Storage for {portfolio_id}: {e}")
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_rag_chain(vectorstore: FAISS):
    """Build a RAG chain using LCEL (LangChain Expression Language) — works on all modern versions."""
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.2, max_output_tokens=512)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an AI assistant representing the professional portfolio of the user.\n"
         "1. Refer to the portfolio owner by their first name, not 'the individual' or 'the candidate'.\n"
         "2. If specific information is NOT in the context, say: 'I don't have that information.' Do not guess.\n"
         "3. Be professional, confident, and direct.\n"
         "4. Answer strictly based on the context provided below.\n\nContext:\n{context}"),
        ("human", "{input}")
    ])

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # LCEL chain: retrieve → format → prompt → LLM → parse
    chain = (
        {"context": retriever | format_docs, "input": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain


def setup_rag_chain(
    portfolio_id: str,
    resume_path: Optional[str] = None,
    details_path: Optional[str] = None,
    text_content: Optional[str] = None
):
    """
    Set up RAG chain for a portfolio.
    resume_path and details_path are LOCAL temp file paths (downloaded by the caller).
    """
    try:
        logger.info(f"Setting up RAG chain for portfolio {portfolio_id}")
        docs = []

        if resume_path and os.path.exists(resume_path):
            try:
                if resume_path.endswith('.pdf'):
                    loader = PyPDFLoader(resume_path)
                else:
                    loader = TextLoader(resume_path)
                docs.extend(loader.load())
            except Exception as e:
                logger.error(f"Error loading resume: {e}")

        if details_path and os.path.exists(details_path):
            try:
                loader = TextLoader(details_path)
                docs.extend(loader.load())
            except Exception as e:
                logger.error(f"Error loading details: {e}")

        if text_content:
            try:
                tmp_txt = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
                tmp_txt.write(text_content)
                tmp_txt.close()
                loader = TextLoader(tmp_txt.name)
                docs.extend(loader.load())
                os.unlink(tmp_txt.name)
            except Exception as e:
                logger.error(f"Error processing text content: {e}")

        if not docs:
            raise ValueError("No documents loaded — check resume/details files.")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=300)
        split_docs = text_splitter.split_documents(docs)
        logger.info(f"Split into {len(split_docs)} chunks")

        embeddings = GeminiEmbeddings()
        vectorstore = FAISS.from_documents(documents=split_docs, embedding=embeddings)

        # Persist to Supabase Storage
        _save_faiss_to_storage(portfolio_id, vectorstore)

        rag_chains[portfolio_id] = _build_rag_chain(vectorstore)
        logger.info(f"RAG chain setup complete for portfolio {portfolio_id}")
        return True

    except Exception as e:
        logger.error(f"RAG setup error: {e}")
        raise


def query_chatbot(portfolio_id: str, message: str) -> str:
    """Query a portfolio's chatbot. Loads from Supabase Storage if not in memory."""
    try:
        if portfolio_id not in rag_chains:
            embeddings = GeminiEmbeddings()
            vectorstore = _load_faiss_from_storage(portfolio_id, embeddings)
            if not vectorstore:
                raise ValueError(f"Portfolio {portfolio_id} chatbot not found. Please re-upload files.")
            rag_chains[portfolio_id] = _build_rag_chain(vectorstore)

        # LCEL chain returns a string directly (StrOutputParser)
        result = rag_chains[portfolio_id].invoke(message)
        return result if isinstance(result, str) else str(result)

    except Exception as e:
        logger.error(f"Query error: {e}")
        raise
