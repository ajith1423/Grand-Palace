
import os
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def add_washbasin_product():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Create/Find "Washbasin" category
    sanitaryware_id = "2c578103-6b53-4c5f-a35f-3b1ea807025f"
    cat_name = "Washbasin"
    
    cat_doc = await db.categories.find_one({"name": cat_name})
    if not cat_doc:
        cat_id = str(uuid.uuid4())
        new_cat = {
            "id": cat_id,
            "name": cat_name,
            "description": "Elegant collection of Washbasins",
            "image": None,
            "icon": "Basin",
            "parent_id": sanitaryware_id,
            "is_active": True,
            "product_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(new_cat)
        print(f"Created category: {cat_name} ({cat_id})")
    else:
        cat_id = cat_doc['id']
        print(f"Using existing category: {cat_name} ({cat_id})")
    
    # 2. Insert Product
    sku = "OPS-WHT-15801PM"
    image_url = "https://uae.jaquar.com/images/thumbs/0104509_wall-hung-basin_960.jpeg"
    
    existing = await db.products.find_one({"sku": sku})
    if existing:
        print(f"Product {sku} already exists. Updating...")
        update_data = {
            "name": "Wall Hung Basin",
            "description": "Wall Hung Basin With Fixing Accessories, Size 600x440x155 mm",
            "category_id": cat_id,
            "images": [image_url],
            "brand": "Jaquar",
            "specifications": {
                "Range": "Opal Prime",
                "Code": sku,
                "Size": "600x440x155 mm"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.products.update_one({"sku": sku}, {"$set": update_data})
        print("Product updated")
    else:
        product_id = str(uuid.uuid4())
        product_doc = {
            "id": product_id,
            "name": "Wall Hung Basin",
            "description": "Wall Hung Basin With Fixing Accessories, Size 600x440x155 mm",
            "price": 850.00,  # Estimated price as none provided
            "offer_price": None,
            "category_id": cat_id,
            "sku": sku,
            "stock": 15,
            "images": [image_url],
            "brand": "Jaquar",
            "specifications": {
                "Range": "Opal Prime",
                "Code": sku,
                "Size": "600x440x155 mm"
            },
            "highlights": ["Wall Hung", "Fixing Accessories included", "Opal Prime Range"],
            "box_contents": ["Basin", "Fixing Accessories"],
            "faqs": [],
            "is_active": True,
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.products.insert_one(product_doc)
        print(f"Product created with ID: {product_id}")
        
        # Update category count
        await db.categories.update_one({"id": cat_id}, {"$inc": {"product_count": 1}})
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_washbasin_product())
