import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Local DB URL
MONGO_URL = "mongodb://localhost:27017/botiee_db"
DB_NAME = "botiee_db"

async def make_admin(email):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"User {email} not found!")
        return

    result = await db.users.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    
    if result.modified_count > 0:
        print(f"User {email} is now an ADMIN.")
    else:
        print(f"User {email} was already an admin or no change needed.")

if __name__ == "__main__":
    asyncio.run(make_admin("akshaysasi12.knr@gmail.com"))
