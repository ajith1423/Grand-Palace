import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def main():
    # Check all products first
    count = await db.products.count_documents({})
    print(f"Total products: {count}")
    
    cursor = db.products.find({"is_featured": True})
    featured = await cursor.to_list(length=100)
    print(f"Featured count: {len(featured)}")
    for p in featured:
        print(f"Product: {p.get('name')} (SKU: {p.get('sku')}), Images: {p.get('images', [])}")

if __name__ == "__main__":
    asyncio.run(main())
