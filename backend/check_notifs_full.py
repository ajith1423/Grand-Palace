
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from pprint import pprint

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "gpgt_ecommerce")

async def check():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"--- Full Notification Detail ---")
    cursor = db.notifications.find().sort("created_at", -1).limit(25)
    notifs = await cursor.to_list(length=25)
    
    for n in notifs:
        print(f"\nType: {n.get('type')} | Read: {n.get('read')} | Created: {n.get('created_at')}")
        print(f"Title: {n.get('title')}")
        print(f"Message: {n.get('message')}")
        print(f"Data: {n.get('data')}")
        
        if n.get('type') == 'new_order':
            order_id = n.get('data', {}).get('order_id')
            if order_id:
                order = await db.orders.find_one({"id": order_id})
                print(f"MATCHING ORDER IN DB: {'FOUND' if order else 'NOT FOUND'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
