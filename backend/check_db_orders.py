
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "gpgt_ecommerce")

async def check_orders():
    print(f"Connecting to: {MONGO_URL}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"Checking database: {DB_NAME}")
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    total_orders = await db.orders.count_documents({})
    print(f"Total orders in DB: {total_orders}")
    
    # Get last 15 orders
    cursor = db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(15)
    orders = await cursor.to_list(length=15)
    
    print("\nLast 15 orders (raw):")
    import json
    for o in orders:
        # Just print order number and created_at
        print(f"ORD: {o.get('order_number')} | DATE: {o.get('created_at')} | ID: {o.get('id')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_orders())
