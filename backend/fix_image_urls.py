import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def fix_image_urls():
    load_dotenv()
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "gpgt_db")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    OLD_URL = "http://127.0.0.1:8000"
    OLD_URL2 = "http://localhost:8000"
    NEW_URL = "http://127.0.0.1:8001"
    
    updated = 0
    async for product in db.products.find({}):
        images = product.get("images", "")
        new_images = images
        if isinstance(images, str):
            new_images = images.replace(OLD_URL, NEW_URL).replace(OLD_URL2, NEW_URL)
        elif isinstance(images, list):
            new_images = [img.replace(OLD_URL, NEW_URL).replace(OLD_URL2, NEW_URL) for img in images]
        
        if new_images != images:
            await db.products.update_one(
                {"id": product["id"]},
                {"$set": {"images": new_images}}
            )
            updated += 1
            print(f"Fixed: {product.get('name', product['id'])}")
    
    print(f"\nDone! Updated image URLs in {updated} products.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_image_urls())
