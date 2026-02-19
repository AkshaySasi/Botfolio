import sys
import os

print("Checking imports...")

try:
    print("Importing supabase...")
    import supabase
    print("Supabase imported.")
except ImportError as e:
    print(f"Failed to import supabase: {e}")
    sys.exit(1)

try:
    print("Importing langchain...")
    import langchain
    print(f"LangChain version: {langchain.__version__}")
    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    print("LangChain chains imported.")
except ImportError as e:
    print(f"Failed to import langchain chains: {e}")
    # Try alternative path
    try:
        from langchain.chains.retrieval import create_retrieval_chain
        print("Found create_retrieval_chain in langchain.chains.retrieval")
    except ImportError as e2:
        print(f"Failed alternative import: {e2}")
    
    sys.exit(1)

try:
    print("Importing rag_engine...")
    import rag_engine
    print("rag_engine imported.")
except ImportError as e:
    print(f"Failed to import rag_engine: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error during rag_engine import: {e}")
    sys.exit(1)

print("All checks passed.")
