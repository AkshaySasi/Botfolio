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
import google.generativeai as genai_sdk

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

# Ordered list of embedding models to try (most preferred first)
_EMBED_MODELS_TO_TRY = [
    "models/gemini-embedding-001",      # confirmed available for this key
    "models/text-embedding-004",
    "models/embedding-001",
    "models/gemini-embedding-exp-03-07",
]
_EMBED_BASE = "https://generativelanguage.googleapis.com/v1beta"


class GeminiEmbeddings(Embeddings):
    """
    Auto-discovers the first working Gemini embedding model for this API key.
    Uses the official v1beta REST API with ?key= query param.
    """
    _active_model: str = None  # class-level cache

    def __init__(self):
        import httpx as _httpx
        self._http = _httpx
        self._api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not GeminiEmbeddings._active_model:
            GeminiEmbeddings._active_model = self._find_working_model()

    def _embed_rest(self, text: str, model: str) -> list:
        url = f"{_EMBED_BASE}/{model}:embedContent"
        payload = {"content": {"parts": [{"text": text}]}}
        resp = self._http.post(
            url, params={"key": self._api_key}, json=payload, timeout=30
        )
        if not resp.is_success:
            body = resp.text[:300]
            raise RuntimeError(f"HTTP {resp.status_code} from {url}: {body}")
        return resp.json()["embedding"]["values"]

    def _find_working_model(self) -> str:
        """Try each model with a test embedding. Return the first that works."""
        for model in _EMBED_MODELS_TO_TRY:
            try:
                self._embed_rest("test", model)
                logger.info(f"✅ Embedding model working: {model}")
                return model
            except Exception as e:
                logger.warning(f"❌ Embedding model {model}: {e}")
        # Log available models for debugging
        try:
            import httpx as _httpx
            r = _httpx.get(
                f"{_EMBED_BASE}/models",
                params={"key": self._api_key},
                timeout=10
            )
            models = r.json().get("models", [])
            embed_models = [m["name"] for m in models
                           if "embedContent" in m.get("supportedGenerationMethods", [])]
            logger.error(f"Available embedding models for this key: {embed_models}")
        except Exception as le:
            logger.error(f"Could not list models: {le}")
        raise RuntimeError(
            "No working embedding model found. "
            "Check GEMINI_API_KEY and see logs for available models."
        )

    def _embed_one(self, text: str) -> list:
        return self._embed_rest(text, GeminiEmbeddings._active_model)

    def embed_documents(self, texts: list) -> list:
        if not texts:
            return []
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


TONE_PROMPTS = {
    "professional": "Be professional, polite, and formal. Use business-appropriate language.",
    "confident": "Be confident, assertive, and direct. Highlight achievements strongly.",
    "friendly": "Be friendly, approachable, and warm. Use a conversational and welcoming tone.",
    "technical": "Be technical, precise, and detailed. Focus on skills, tools, and technical specifications.",
    "executive": "Be concise, high-level, and results-oriented. Focus on impact, strategy, and leadership."
}


def _build_rag_chain(vectorstore: FAISS, tone: str = "professional", context_aware: bool = False):
    """Build a RAG chain using LCEL (LangChain Expression Language) — works on all modern versions."""
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.2, max_output_tokens=512)

    GUARDRAIL_INSTRUCTION = (
        "CRITICAL GUARDRAIL: You are a professional AI representative. Stay strictly on topic about the candidate's professional profile, skills, and experience. "
        "Politely decline to answer questions that are unrelated to the candidate (e.g., general news, math problems, jokes, political opinions, or other people). "
        "If a question is outside this scope, say: 'I'm here to discuss [Name]'s professional background. Let's get back to their skills or experience.' "
        "and pivot back to a relevant highlight from the context."
    )

    tone_instruction = TONE_PROMPTS.get(tone.lower(), TONE_PROMPTS["professional"])
    
    system_msg = (
        "You are an AI assistant representing the professional portfolio of the user.\n"
        "1. Refer to the portfolio owner by their first name, not 'the individual' or 'the candidate'.\n"
        "2. If specific information is NOT in the context, say: 'I don't have that information.' Do not guess.\n"
        f"3. {tone_instruction}\n"
        "4. Answer strictly based on the context provided below.\n"
        "5. Respond in the same language the user uses for their message (e.g. if they ask in Hindi, reply in Hindi).\n\n"
    )

    if context_aware:
        system_msg += f"5. {GUARDRAIL_INSTRUCTION}\n\n"

    system_msg += "Context:\n{context}"

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_msg),
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
    text_content: Optional[str] = None,
    tone: str = "professional"
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

        rag_chains[portfolio_id] = _build_rag_chain(vectorstore, tone=tone)
        logger.info(f"RAG chain setup complete for portfolio {portfolio_id}")
        return True

    except Exception as e:
        logger.error(f"RAG setup error: {e}")
        raise


def clear_rag_chain(portfolio_id: str):
    """Clear a portfolio's RAG chain from the in-memory cache."""
    if portfolio_id in rag_chains:
        del rag_chains[portfolio_id]
        logger.info(f"Cleared RAG chain for {portfolio_id} from memory")


def query_chatbot(portfolio_id: str, message: str, tone: str = "professional", context_aware: bool = False) -> str:
    """Query a portfolio's chatbot. Loads from Supabase Storage if not in memory."""
    try:
        # If settings changed (tone/guardrail), we assume caller called clear_rag_chain
        if portfolio_id not in rag_chains:
            embeddings = GeminiEmbeddings()
            vectorstore = _load_faiss_from_storage(portfolio_id, embeddings)
            if not vectorstore:
                raise ValueError(f"Portfolio {portfolio_id} chatbot not found. Please re-upload files.")
            rag_chains[portfolio_id] = _build_rag_chain(vectorstore, tone=tone, context_aware=context_aware)

        # LCEL chain returns a string directly (StrOutputParser)
        result = rag_chains[portfolio_id].invoke(message)
        return result if isinstance(result, str) else str(result)

    except Exception as e:
        logger.error(f"Query error: {e}")
        raise


def generate_summary(messages: list) -> str:
    """Generate a professional summary of a chat session for a recruiter."""
    try:
        llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3)
        
        chat_history = ""
        for m in messages:
            role = "Recruiter" if m['role'] == 'user' else "AI Assistant"
            chat_history += f"{role}: {m['content']}\n"

        prompt = (
            "You are an expert talent scout. Summarize the following conversation between a recruiter "
            "and an AI assistant representing a candidate. Highlight key skills discussed, "
            "the candidate's fit for potential roles, and any notable achievements mentioned.\n\n"
            "Keep the summary professional, concise, and formatted with bullet points for readability.\n\n"
            f"Conversation:\n{chat_history}\n\nSummary:"
        )
        
        result = llm.invoke(prompt)
        return result.content if hasattr(result, 'content') else str(result)
    except Exception as e:
        logger.error(f"Summary generation error: {e}")
        return "Failed to generate summary."
