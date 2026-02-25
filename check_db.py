import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
from pathlib import Path

async def check():
    load_dotenv(Path('backend/.env'))
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME')
    print(f"Connecting to {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check categories
    cat_count = await db.categories.count_documents({})
    print(f"Categories count: {cat_count}")
    
    # Check products
    prod_count = await db.products.count_documents({})
    print(f"Products count: {prod_count}")
    
    if prod_count > 0:
        first_prod = await db.products.find_one({})
        print(f"Sample product: {first_prod.get('name')}")
        print(f"Image URL: {first_prod.get('image_url') or first_prod.get('image')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check())
