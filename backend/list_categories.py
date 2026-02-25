
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def list_categories():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    categories = await db.categories.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    for cat in categories:
        print(f"ID: {cat['id']}, Name: {cat['name']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(list_categories())
