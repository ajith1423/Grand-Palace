
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def find_category():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Search in categories
    query = {"name": {"$regex": "Water", "$options": "i"}}
    cat = await db.categories.find_one(query)
    
    if cat:
        print(f"Category found: {cat['id']}, Name: {cat['name']}")
    else:
        # Check all categories to see if they have subcategories containing "Water"
        all_cats = await db.categories.find().to_list(100)
        found = False
        for c in all_cats:
            subcats = c.get("subcategories", [])
            for sub in subcats:
                if "Water" in sub:
                    print(f"Found in subcategories of {c['name']}: {sub}")
                    found = True
        if not found:
            print("No category matching 'Water' found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_category())
