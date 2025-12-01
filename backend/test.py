from pymongo import MongoClient

MONGO_URL = "mongodb+srv://botfolio_user:botfolio5353@botfolio.oiioipo.mongodb.net/botiee_db?retryWrites=true&w=majority&authSource=admin&appName=Botfolio"
DB_NAME = "botiee_db"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

print(db.list_collection_names())
