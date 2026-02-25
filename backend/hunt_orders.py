
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "gpgt_ecommerce")

async def search_all_collections():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"Searching for 'GPGT-' in all collections of {DB_NAME}...")
    
    collections = await db.list_collection_names()
    for coll_name in collections:
        coll = db[coll_name]
        count = await coll.count_documents({"order_number": {"$regex": "^GPGT-"}})
        if count > 0:
            print(f"Found {count} docs in '{coll_name}' with GPGT- order number!")
            docs = await coll.find({"order_number": {"$regex": "^GPGT-"}}).to_list(10)
            for d in docs:
                print(f"  - {d.get('order_number')} | id: {d.get('id')}")
        
        # Also check notifications just in case
        if coll_name == 'notifications':
            count_notif = await coll.count_documents({"data.order_number": {"$regex": "^GPGT-"}})
            if count_notif > 0:
                print(f"Found {count_notif} notifications for GPGT- orders!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(search_all_collections())
