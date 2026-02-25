
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def clear_all_products():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Delete all products
    delete_result = await db.products.delete_many({})
    print(f"Deleted {delete_result.deleted_count} products from the database.")
    
    # 2. Reset category product counts
    update_result = await db.categories.update_many({}, {"$set": {"product_count": 0}})
    print(f"Reset product count for {update_result.modified_count} categories.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_products())
