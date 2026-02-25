
import os
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def update_product_and_category():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Create/Find "Water Closet" category
    sanitaryware_id = "2c578103-6b53-4c5f-a35f-3b1ea807025f"
    wc_name = "Water Closet"
    
    wc_cat = await db.categories.find_one({"name": wc_name})
    if not wc_cat:
        wc_id = str(uuid.uuid4())
        wc_doc = {
            "id": wc_id,
            "name": wc_name,
            "name_ar": None,
            "description": "Premium collection of Water Closets",
            "image": None,
            "icon": "Toilet",
            "parent_id": sanitaryware_id,
            "is_active": True,
            "product_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(wc_doc)
        print(f"Created category: {wc_name} ({wc_id})")
    else:
        wc_id = wc_cat['id']
        print(f"Using existing category: {wc_name} ({wc_id})")
    
    # 2. Update Product
    sku = "ITS-WHT-89853S300PPPM"
    image_url = "https://uae.jaquar.com/images/thumbs/0088255_automatic-rimless-floor-mounted-wc_960.jpeg"
    
    update_data = {
        "category_id": wc_id,
        "images": [image_url],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.products.update_one({"sku": sku}, {"$set": update_data})
    
    if result.matched_count > 0:
        print(f"Updated product {sku} with new image and category")
        # Update product count for new category
        await db.categories.update_one({"id": wc_id}, {"$inc": {"product_count": 1}})
    else:
        print(f"Product with SKU {sku} not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_product_and_category())
