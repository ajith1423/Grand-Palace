import asyncio
import shutil
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Paths
BRAIN_DIR = "/Users/ajith/.gemini/antigravity/brain/85304aea-3961-4495-b6d4-60007a900561"
UPLOADS_DIR = "/Users/ajith/Downloads/Gpgt-conflict_220226_2239/backend/uploads"

# Copy images to backend uploads
shutil.copy(f"{BRAIN_DIR}/gpgt_5_1771951062454.png", f"{UPLOADS_DIR}/gpgt_5.png")
shutil.copy(f"{BRAIN_DIR}/gpgt_7_1771951238481.png", f"{UPLOADS_DIR}/gpgt_7.png")
shutil.copy(f"{BRAIN_DIR}/gpgt_8_1771951373414.png", f"{UPLOADS_DIR}/gpgt_8.png")

BASE_API = "http://localhost:8000/api"

# Fix Database
load_dotenv(Path(__file__).parent / '.env')
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def main():
    # Update the 7 featured products missing images
    updates = {
        "GPGT-0000004": [f"https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600"],
        "GPGT-0000005": [f"{BASE_API}/uploads/gpgt_5.png"],
        "GPGT-0000007": [f"{BASE_API}/uploads/gpgt_7.png"],
        "GPGT-0000008": [f"{BASE_API}/uploads/gpgt_8.png"],
        "GPGT-0000009": [f"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"],
        "GPGT-0000011": [f"https://images.unsplash.com/photo-1580975877420-b38faeefbe59?w=600"],
        "GPGT-0000012": [f"https://images.unsplash.com/photo-1560067160-c3d3a015af29?w=600"]
    }
    
    for sku, images in updates.items():
        res = await db.products.update_one({"sku": sku}, {"$set": {"images": images}})
        print(f"Updated {sku}: matched {res.matched_count}")
        
    # Also fix the existing ones that start with /api/uploads
    cursor = db.products.find({"images": {"$regex": "^/api/uploads"}})
    docs = await cursor.to_list(100)
    for doc in docs:
        new_images = []
        for img in doc.get("images", []):
            if img.startswith("/api/uploads"):
                new_images.append(f"http://localhost:8000{img}")
            else:
                new_images.append(img)
        await db.products.update_one({"_id": doc["_id"]}, {"$set": {"images": new_images}})
        print(f"Fixed existing relative image URL for SKU {doc.get('sku')}")

asyncio.run(main())
