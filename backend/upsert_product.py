
import os
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def create_product():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    product_id = str(uuid.uuid4())
    sku = "ITS-WHT-89853S300PPPM"
    
    # Check if exists (redundant but safe)
    existing = await db.products.find_one({"sku": sku})
    if existing:
        print(f"Product with SKU {sku} already exists ID: {existing['id']}")
        # Update instead
        update_doc = {
            "name": "Automatic Rimless Floor Mounted WC",
            "description": "Automatic Rimless Floor Mounted WC With Electronic PP Seat Cover, Adjustable Seat, Air, Water temperature, Night light, Fixing Accessories And Accessories Set, Size: 390x685x465 mm, S Trap- 300 mm",
            "brand": "Jaquar",
            "highlights": [
                "Smart button", "UV nozzle", "LED light", 
                "Adjustable temperature-water, air & seat", 
                "Smart deodorization", "Automatic flushing", 
                "Bidet & rear wash", "Self cleaning", 
                "4.8L average flushing volume", "Seat thickness is 6.5cm", 
                "Smart flushing system with brushless motor", 
                "Slim in shape", "Powerful flushing with low noise", 
                "Remote operated"
            ],
            "specifications": {
                "Range": "Toilet Seat",
                "Code": "ITS-WHT-89853S300PPPM",
                "Size": "390x685x465 mm",
                "Trap": "S Trap- 300 mm"
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.products.update_one({"sku": sku}, {"$set": update_doc})
        print("Product updated")
    else:
        product_doc = {
            "id": product_id,
            "name": "Automatic Rimless Floor Mounted WC",
            "description": "Automatic Rimless Floor Mounted WC With Electronic PP Seat Cover, Adjustable Seat, Air, Water temperature, Night light, Fixing Accessories And Accessories Set, Size: 390x685x465 mm, S Trap- 300 mm",
            "price": 2999.00,
            "offer_price": None,
            "category_id": "2c578103-6b53-4c5f-a35f-3b1ea807025f", # Sanitaryware
            "sku": sku,
            "stock": 10,
            "images": ["https://via.placeholder.com/600x600?text=Automatic+WC"],
            "brand": "Jaquar",
            "specifications": {
                "Range": "Toilet Seat",
                "Code": "ITS-WHT-89853S300PPPM",
                "Size": "390x685x465 mm",
                "Trap": "S Trap- 300 mm"
            },
            "highlights": [
                "Smart button", "UV nozzle", "LED light", 
                "Adjustable temperature-water, air & seat", 
                "Smart deodorization", "Automatic flushing", 
                "Bidet & rear wash", "Self cleaning", 
                "4.8L average flushing volume", "Seat thickness is 6.5cm", 
                "Smart flushing system with brushless motor", 
                "Slim in shape", "Powerful flushing with low noise", 
                "Remote operated"
            ],
            "box_contents": ["Electronic PP Seat Cover", "Fixing Accessories", "Accessories Set"],
            "faqs": [],
            "is_active": True,
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.products.insert_one(product_doc)
        print(f"Product created with ID: {product_id}")
        
        # Update category count
        await db.categories.update_one({"id": "2c578103-6b53-4c5f-a35f-3b1ea807025f"}, {"$inc": {"product_count": 1}})
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_product())
