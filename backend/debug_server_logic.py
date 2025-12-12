import asyncio
import os
from datetime import datetime, timezone
import traceback

# Mock env if needed or let server load it
# We will try to import everything from server
try:
    print("Importing server...")
    from server import User, hash_password, db, create_access_token
    print("Server imported.")
except Exception:
    print("Failed to import server:")
    traceback.print_exc()
    exit(1)

async def test_logic():
    print("Starting logic test...")
    try:
        # 0. Check Env
        print(f"MONGO_URL: {os.environ.get('MONGO_URL')}")

        # 1. Test Hash
        print("Testing hash...")
        pwd = hash_password("testpass")
        print(f"Hash success: {pwd[:10]}...")

        # 2. Test DB Connection
        print("Testing DB...")
        count = await db.users.count_documents({})
        print(f"DB Connected. User count: {count}")

        # 3. Test User Model & Insert
        print("Testing User Insert...")
        unique_email = f"debug_{int(datetime.now().timestamp())}@example.com"
        user = User(
            email=unique_email,
            name="Debug User",
            auth_provider="email"
        )
        user_dict = user.model_dump()
        user_dict['password_hash'] = pwd
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        
        await db.users.insert_one(user_dict)
        print("User Inserted Successfully")

        # 4. Test Token
        print("Testing Token...")
        token = create_access_token({"user_id": user.id, "email": user.email})
        print("Token created:", token[:10])

        print("ALL TESTS PASSED")
    except Exception:
        print("CRASHED:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_logic())
