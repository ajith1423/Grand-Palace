
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "gpgt_ecommerce")

async def check():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    order_count = await db.orders.count_documents({})
    notif_count = await db.notifications.count_documents({})
    enq_count = await db.enquiries.count_documents({})
    
    print(f"DB: {DB_NAME}")
    print(f"Orders: {order_count}")
    print(f"Notifications: {notif_count}")
    print(f"Enquiries: {enq_count}")
    
    # Print the last order number
    last_order = await db.orders.find().sort("created_at", -1).limit(1).to_list(1)
    if last_order:
        print(f"Last Order: {last_order[0].get('order_number')} at {last_order[0].get('created_at')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
