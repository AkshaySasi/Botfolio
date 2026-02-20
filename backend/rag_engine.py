import os
import io
import logging
import tempfile
import shutil
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

try:
    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    try:
        from langchain.chains.retrieval import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
    except ImportError:
        logging.getLogger(__name__).error("Could not import langchain chains. RAG will not work.")
        create_retrieval_chain = None
        create_stuff_documents_chain = None

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import FAISS

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
EMBEDDING_MODEL = "models/text-embedding-004"

# In-memory cache mapping portfolio_id -> rag_chain
rag_chains = {}

# Local cache dir for vector stores (populated from Supabase Storage when needed)
VECTOR_CACHE_DIR = ROOT_DIR / "vector_cache"
VECTOR_CACHE_DIR.mkdir(exist_ok=True)

STORAGE_INDEXES_BUCKET = "portfolio-indexes"


def _get_supabase():
    """Lazy import supabase client to avoid circular imports."""
    from supabase_client import supabase
    return supabase


def _save_faiss_to_storage(portfolio_id: str, vectorstore: FAISS):
    """Save FAISS index files to Supabase Storage."""
    tmp_dir = tempfile.mkdtemp()
    try:
        vectorstore.save_local(tmp_dir)
        supabase = _get_supabase()
        for fname in ["index.faiss", "index.pkl"]:
            fpath = os.path.join(tmp_dir, fname)
            if os.path.exists(fpath):
                with open(fpath, "rb") as f:
                    data = f.read()
                storage_path = f"{portfolio_id}/{fname}"
                supabase.storage.from_(STORAGE_INDEXES_BUCKET).upload(
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
        supabase = _get_supabase()
        for fname in ["index.faiss", "index.pkl"]:
            storage_path = f"{portfolio_id}/{fname}"
            file_bytes = supabase.storage.from_(STORAGE_INDEXES_BUCKET).download(storage_path)
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
    """Build a LangChain RAG chain from a loaded vectorstore."""
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.2, max_output_tokens=512)
    system_prompt = (
        "You are an AI assistant representing the professional portfolio of the user. "
        "1. **Identity**: Refer to the portfolio owner by their FIRST NAME instead of 'the individual' or 'the candidate'. "
        "2. **Unknowns**: If specific information is not in the context, say: 'I don't have that information.' DO NOT guess. "
        "3. **Tone**: Professional, confident, and direct. "
        "4. **Scope**: Answer strictly based on the provided context below.\n\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}")
    ])
    if not create_retrieval_chain or not create_stuff_documents_chain:
        raise ImportError("LangChain chain helpers not available.")
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, question_answer_chain)


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

        embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)
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
            embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)
            vectorstore = _load_faiss_from_storage(portfolio_id, embeddings)
            if not vectorstore:
                raise ValueError(f"Portfolio {portfolio_id} chatbot not found. Please re-upload files.")
            rag_chains[portfolio_id] = _build_rag_chain(vectorstore)

        response = rag_chains[portfolio_id].invoke({"input": message})
        return response.get("answer", "I couldn't process that question.")

    except Exception as e:
        logger.error(f"Query error: {e}")
        raise
