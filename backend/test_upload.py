import asyncio
import os
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import jwt
from datetime import datetime, timezone, timedelta

load_dotenv()
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def test_upload():
    # 1. Get Admin Token
    admin = await db.users.find_one({"email": "admin@gpgt.ae"})
    if not admin:
        print("Admin not found")
        return
        
    payload = {
        "sub": str(admin["_id"]),
        "email": admin["email"],
        "role": admin.get("role", "customer"),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    token = jwt.encode(payload, os.environ.get('JWT_SECRET', 'gpgt_super_secret_key_2025_uae_secure'), algorithm="HS256")
    
    # 2. Upload dummy image
    # Write dummy jpg (valid header for image/jpeg is needed if we strictly check, but we only check content_type in FastAPI)
    with open("dummy.jpg", "wb") as f:
        f.write(b"dummy content")
        
    async with httpx.AsyncClient() as c:
        with open("dummy.jpg", "rb") as f:
            files = {'file': ('dummy.jpg', f, 'image/jpeg')}
            headers = {"Authorization": f"Bearer {token}"}
            resp = await c.post("http://127.0.0.1:8000/api/upload/image", files=files, headers=headers)
            print("Response status:", resp.status_code)
            print("Response body:", resp.json())

asyncio.run(test_upload())
