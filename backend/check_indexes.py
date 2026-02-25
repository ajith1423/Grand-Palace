
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
    
    indexes = await db.orders.list_indexes().to_list(length=100)
    print(f"Indexes on orders: {indexes}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
