
import os
import asyncio
import uuid
import json
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def migrate_products():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Load extracted data
    with open('jaquar_products.json', 'r') as f:
        products_data = json.load(f)
    
    sanitaryware_id = "2c578103-6b53-4c5f-a35f-3b1ea807025f"
    
    # Category Icons Mapping
    cat_icons = {
        "Water Closet": "Toilet",
        "Washbasin": "Basin",
        "Urinal": "Urinal",
        "Faucets & Valves": "Faucet",
        "Bath Accessories": "Towel",
        "Showers": "Shower",
        "Water Heaters": "Heater",
        "Bath Tubs": "Tub"
    }
    
    for item in products_data:
        cat_name = item['category_name']
        sku = item['sku']
        
        # 1. Find or Create Subcategory
        cat = await db.categories.find_one({"name": cat_name})
        if not cat:
            cat_id = str(uuid.uuid4())
            new_cat = {
                "id": cat_id,
                "name": cat_name,
                "name_ar": None,
                "description": f"Quality {cat_name} collections",
                "image": None,
                "icon": cat_icons.get(cat_name, "Settings"),
                "parent_id": sanitaryware_id,
                "is_active": True,
                "product_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(new_cat)
            print(f"Created category: {cat_name}")
        else:
            cat_id = cat['id']
            print(f"Using category: {cat_name}")
            
        # 2. Insert Product
        product_doc = {
            "id": str(uuid.uuid4()),
            "name": item['name'],
            "name_ar": None,
            "description": item['description'],
            "description_ar": None,
            "price": 0.0, # Placeholder
            "offer_price": None,
            "category_id": cat_id,
            "sku": sku,
            "stock": 20,
            "images": [item['image_url']],
            "brand": "Jaquar",
            "specifications": item['specifications'],
            "highlights": item['features'],
            "box_contents": [],
            "faqs": [],
            "is_active": True,
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if SKU exists
        existing = await db.products.find_one({"sku": sku})
        if existing:
            await db.products.update_one({"sku": sku}, {"$set": product_doc})
            print(f"Updated product: {sku}")
        else:
            await db.products.insert_one(product_doc)
            # Update category count
            await db.categories.update_one({"id": cat_id}, {"$inc": {"product_count": 1}})
            print(f"Inserted product: {sku}")
    
    print("Migration complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_products())
