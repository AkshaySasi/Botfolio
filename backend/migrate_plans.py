import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(url, key)

def migrate_users():
    print("Starting user migration to new Botfolio pricing tiers...")
    
    try:
        # Update 'starter' to 'creator'
        res1 = supabase.table("users").update({"subscription_tier": "creator"}).eq("subscription_tier", "starter").execute()
        print(f"Migrated {len(res1.data)} users from starter to creator")
        
        # Update 'pro' to 'growth'
        res2 = supabase.table("users").update({"subscription_tier": "growth"}).eq("subscription_tier", "pro").execute()
        print(f"Migrated {len(res2.data)} users from pro to growth")
        
        # Update 'agency' to 'growth'
        res3 = supabase.table("users").update({"subscription_tier": "growth"}).eq("subscription_tier", "agency").execute()
        print(f"Migrated {len(res3.data)} users from agency to growth")

        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_users()
