#!/usr/bin/env python3
"""
MongoDB Connection Test Script
Run this on your server to verify MongoDB connectivity
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_mongodb():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'botiee_db')
    
    print(f"🔍 Testing MongoDB Connection")
    print(f"📍 MongoDB URL: {mongo_url}")
    print(f"📁 Database Name: {db_name}")
    print("-" * 50)
    
    try:
        # Create client
        print("⏳ Connecting to MongoDB...")
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Get database
        db = client[db_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"📚 Collections in '{db_name}': {collections if collections else 'None (database is empty)'}")
        
        # Count documents in key collections
        if 'users' in collections:
            user_count = await db.users.count_documents({})
            print(f"👥 Users count: {user_count}")
        
        if 'portfolios' in collections:
            portfolio_count = await db.portfolios.count_documents({})
            print(f"📂 Portfolios count: {portfolio_count}")
        
        print("\n✅ MongoDB is working correctly!")
        client.close()
        return True
        
    except Exception as e:
        print(f"\n❌ MongoDB Connection Failed!")
        print(f"Error: {type(e).__name__}: {e}")
        print("\n💡 Possible issues:")
        print("  1. MongoDB is not installed or running")
        print("  2. MongoDB URL is incorrect")
        print("  3. Network/firewall blocking connection")
        print("  4. Authentication required but not provided")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_mongodb())
    exit(0 if result else 1)
