import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_test():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    test = await db.categories.find_one({'name': 'test'}, {'_id': 0})
    print(f"Test category structure: {test}")
    
    # Also check if it appears in a simple find().sort().to_list()
    cats = await db.categories.find({}, {'_id': 0}).sort('created_at', -1).to_list(10)
    print("\nTop 10 categories from DB (Sorted DESC):")
    for i, c in enumerate(cats):
        print(f"{i}. {c.get('name')} (Created: {c.get('created_at')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_test())
