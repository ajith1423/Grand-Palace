import asyncio
import os
import jwt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv()
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_token():
    admin = await db.users.find_one({"email": "admin@gpgt.ae"})
    if admin:
        payload = {
            "sub": str(admin["_id"]),
            "email": admin["email"],
            "role": admin.get("role", "customer"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24)
        }
        token = jwt.encode(payload, os.environ.get('JWT_SECRET', 'gpgt_super_secret_key_2025_uae_secure'), algorithm="HS256")
        print(token)

asyncio.run(get_token())
