import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")             # anon key — for DB queries
service_key: str = os.environ.get("SUPABASE_SERVICE_KEY", key)  # service_role — for Storage

if not url or not key:
    logger.error("Supabase credentials not found (SUPABASE_URL, SUPABASE_KEY)")
    supabase: Client = None
    supabase_admin: Client = None
else:
    try:
        supabase: Client = create_client(url, key)
        # Use service_role key for storage uploads (bypasses bucket policies)
        supabase_admin: Client = create_client(url, service_key)
        logger.info("Supabase client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None
        supabase_admin = None
