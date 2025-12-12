import os
import logging
from pathlib import Path
from typing import Optional
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
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

# Store RAG chains in memory (in production, use Redis or similar)
rag_chains = {}

def setup_rag_chain(portfolio_id: str, resume_path: Optional[str] = None, details_path: Optional[str] = None, text_content: Optional[str] = None):
    """
    Set up RAG chain for a portfolio
    """
    try:
        logger.info(f"Setting up RAG chain for portfolio {portfolio_id}")
        
        # Load documents
        docs = []
        
        if resume_path and os.path.exists(resume_path):
            try:
                if resume_path.endswith('.pdf'):
                    loader = PyPDFLoader(resume_path)
                    docs.extend(loader.load())
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
                # Save text content to a temporary file to use TextLoader for consistency
                text_path = ROOT_DIR / "uploads" / portfolio_id / "additional_text.txt"
                text_path.parent.mkdir(parents=True, exist_ok=True)
                with open(text_path, "w", encoding="utf-8") as f:
                    f.write(text_content)
                
                loader = TextLoader(str(text_path))
                docs.extend(loader.load())
            except Exception as e:
                logger.error(f"Error processing text content: {e}")
        
        if not docs:
            # If no docs, create a dummy doc to avoid failure (e.g. if user only wants to chat generally or setup failed)
            # But better to raise error to warn user 
            # actually for Empty portfolios we might support it later, but strictly per requirements:
            # "users need to login... and upload resume...". 
            # But "details.txt optional and a text box (also optional)".
            # If resume is missing causing empty docs, we fail.
            if not resume_path and not text_content and not details_path:
                 raise ValueError("No content provided to train chatbot")
            
            # If docs is still empty (e.g. failed to load), we might want to handle gracefully
            if not docs:
                 raise ValueError("Failed to load any documents")
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=300
        )
        split_docs = text_splitter.split_documents(docs)
        logger.info(f"Split into {len(split_docs)} chunks")
        
        # Create embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
        
        # Create vector store
        vectorstore = FAISS.from_documents(documents=split_docs, embedding=embeddings)
        
        # Save vector store
        vector_dir = ROOT_DIR / "vector_stores" / portfolio_id
        vector_dir.mkdir(parents=True, exist_ok=True)
        vectorstore.save_local(str(vector_dir))
        
        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        # Create LLM
        llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            temperature=0.2,
            max_output_tokens=512
        )
        
        # Create prompt
        system_prompt = (
            "You are a professional career chatbot for this person's AI portfolio. "
            "Respond in third person, professionally and engagingly, using ONLY the provided context. "
            "For HR questions, highlight their strengths, achievements, and fit based on their data. "
            "Keep responses detailed but concise (3-6 sentences), as if they're in an interview. "
            "If no relevant context is available, respond with: 'I don't have enough details to answer that fully, but I'm happy to discuss their education, projects, or skills!' "
            "For queries unrelated to this portfolio, respond ONLY with: 'Sorry, I can only discuss this professional portfolio.' "
            "Do not speculate or fabricate information.\n\n{context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        # Store in memory
        rag_chains[portfolio_id] = rag_chain
        
        logger.info(f"RAG chain setup complete for portfolio {portfolio_id}")
        return True
        
    except Exception as e:
        logger.error(f"RAG setup error: {e}")
        raise

def query_chatbot(portfolio_id: str, message: str) -> str:
    """
    Query a portfolio's chatbot
    """
    try:
        # Check if chain exists in memory
        if portfolio_id not in rag_chains:
            # Try to load from disk
            vector_dir = ROOT_DIR / "vector_stores" / portfolio_id
            if not vector_dir.exists():
                raise ValueError(f"Portfolio {portfolio_id} not found")
            
            # Load vector store
            embeddings = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True}
            )
            vectorstore = FAISS.load_local(
                str(vector_dir),
                embeddings,
                allow_dangerous_deserialization=True
            )
            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}
            )
            
            # Create LLM
            llm = ChatGoogleGenerativeAI(
                model=MODEL_NAME,
                temperature=0.2,
                max_output_tokens=512
            )
            
            # Create prompt
            system_prompt = (
                "You are a professional career chatbot for this person's AI portfolio. "
                "Respond in third person, professionally and engagingly, using ONLY the provided context. "
                "For HR questions, highlight their strengths, achievements, and fit based on their data. "
                "Keep responses detailed but concise (3-6 sentences), as if they're in an interview. "
                "If no relevant context is available, respond with: 'I don't have enough details to answer that fully, but I'm happy to discuss their education, projects, or skills!' "
                "For queries unrelated to this portfolio, respond ONLY with: 'Sorry, I can only discuss this professional portfolio.' "
                "Do not speculate or fabricate information.\n\n{context}"
            )
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "{input}")
            ])
            
            question_answer_chain = create_stuff_documents_chain(llm, prompt)
            rag_chain = create_retrieval_chain(retriever, question_answer_chain)
            
            # Store in memory
            rag_chains[portfolio_id] = rag_chain
        
        # Query the chain
        response = rag_chains[portfolio_id].invoke({"input": message})
        return response.get("answer", "I couldn't process that question.")
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise
