
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "gpgt_ecommerce")

async def get_pid():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    p = await db.products.find_one({"is_active": True})
    if p:
        print(f"PID: {p['id']} | Name: {p['name']}")
    client.close()

if __name__ == "__main__":
    asyncio.run(get_pid())
