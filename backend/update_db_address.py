import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def update_address():
    load_dotenv()
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "gpgt_db")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    new_address = "Shop No:3 Al Sajaya Building, Al Qusais 2, Damascus St.  244, Sector, Dubai, United Arab Emirates"
    
    result = await db.settings.update_one(
        {"id": "global"},
        {"$set": {"company_address": new_address}}
    )
    
    if result.matched_count > 0:
        print(f"Successfully updated address in database. Modified count: {result.modified_count}")
    else:
        # If no global settings doc exists, server.py will use defaults anyway, 
        # but let's try to find if it uses another ID or if the table is empty.
        print("No 'global' settings document found to update.")
        # Check if there are any settings docs
        count = await db.settings.count_documents({})
        if count == 0:
            print("Settings collection is empty. Server will use hardcoded defaults.")
        else:
            print(f"Found {count} documents in settings collection. Checking for other IDs...")
            async for doc in db.settings.find({}):
                print(f"ID found: {doc.get('id')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_address())
