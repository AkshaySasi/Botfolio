import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env vars
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    logger.error("Supabase credentials not found in environment variables (SUPABASE_URL, SUPABASE_KEY)")
    # We don't raise error immediately to verify_api.py works, but app will fail
    supabase: Client = None
else:
    try:
        supabase: Client = create_client(url, key)
        logger.info("Supabase client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None
