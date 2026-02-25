
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_product():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    sku = "ITS-WHT-89853S300PPPM"
    product = await db.products.find_one({"sku": sku})
    
    if product:
        print(f"Product found: {product['id']}")
    else:
        print("Product not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_product())
