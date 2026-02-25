
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def move_product():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    sku = "OPS-WHT-15801PM"
    new_cat_id = "2fbe8779-e314-4374-ac3d-97c36364fc48" # Water Closet
    old_cat_id = "376e35ce-5648-4933-a1b6-fd7bab7db951" # Washbasin
    
    # 1. Update Product
    result = await db.products.update_one(
        {"sku": sku}, 
        {"$set": {"category_id": new_cat_id}}
    )
    
    if result.matched_count > 0:
        print(f"Updated product {sku} to category {new_cat_id}")
        
        # 2. Update Counts
        await db.categories.update_one({"id": old_cat_id}, {"$inc": {"product_count": -1}})
        await db.categories.update_one({"id": new_cat_id}, {"$inc": {"product_count": 1}})
        print("Updated category product counts")
    else:
        print(f"Product with SKU {sku} not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(move_product())
