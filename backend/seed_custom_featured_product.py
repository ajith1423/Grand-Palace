import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "gpgt")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def seed_product():
    # Find existing category
    category = await db.categories.find_one({"name": "Faucets & Valves"})
    if not category:
        category = await db.categories.find_one({"name": "Sanitaryware"})
    
    cat_id = category["id"] if category else "cat_sanitaryware"

    sku = "GPGT-0000004"
    
    existing = await db.products.find_one({"sku": sku})
    if existing:
        print(f"Product {sku} already exists! Updating instead...")
        await db.products.update_one({"sku": sku}, {"$set": {"is_featured": True}})
        print("Updated existing product to be featured.")
        return

    product = {
        "id": str(uuid.uuid4()),
        "name": "Flow Restrictor Assembly (ZMS-CHR-176B)",
        "description": "Product Type: Flow Restrictor Assembly\nApplication: Shower Head (part of the ZAR / Zara range)\nFinish: Chrome (CHR)\nFlow Rate: 8 Liters Per Minute (LPM) @ 3.0 Bar pressure\nColor/Variant: Light Violet",
        "price": 12.00,
        "offer_price": 10.00,
        "category_id": cat_id,
        "sku": sku,
        "stock": 100,
        "images": [],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "highlights": [
            "Flow Restrictor Assembly",
            "Chrome (CHR) Finish",
            "8 Liters Per Minute (LPM) @ 3.0 Bar pressure",
            "Shower Head Application (ZAR range)"
        ],
        "specifications": {
            "Brand": "Jaquar",
            "Product Type": "Flow Restrictor Assembly",
            "Application": "Shower Head (ZAR / Zara range)",
            "Finish": "Chrome (CHR)",
            "Flow Rate": "8 Liters Per Minute (LPM) @ 3.0 Bar pressure",
            "Color/Variant": "Light Violet"
        },
        "box_contents": ["1x Flow Restrictor Assembly"],
        "faqs": [],
        "cost": 7.00
    }
    
    await db.products.insert_one(product)
    print("Featured product 'Flow Restrictor Assembly' seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_product())
