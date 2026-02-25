
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
    
    print(f"Checking {DB_NAME}")
    
    # Get all "new_order" notifications
    cursor = db.notifications.find({"type": "new_order"}).sort("created_at", -1)
    notifs = await cursor.to_list(length=50)
    
    print(f"\nFound {len(notifs)} 'new_order' notifications:")
    for n in notifs:
        order_id = n.get("data", {}).get("order_id")
        order_num = n.get("data", {}).get("order_number")
        
        # Check if the order exists
        order_exists = await db.orders.count_documents({"id": order_id}) if order_id else 0
        
        print(f"Notif: {n.get('title')} | Msg: {n.get('message')} | OrderID: {order_id} | OrderNum: {order_num} | Exists In Orders Coll: {'YES' if order_exists else 'NO'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
