import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def update_phones():
    load_dotenv(dotenv_path='backend/.env')
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "gpgt_db")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    updates = {
        "company_phone": "+971 4 272 7815",
        "company_mobile": "+971 54 568 0916",
        "company_email": "sales@gpgt.ae",
        "whatsapp_number": "+971 54 568 0916"
    }
    
    result = await db.settings.update_one(
        {"id": "global"},
        {"$set": updates}
    )
    
    if result.matched_count > 0:
        print(f"Successfully updated phone/email in database. Modified count: {result.modified_count}")
    else:
        print("No 'global' settings document found. Inserting default settings...")
        # If it doesn't exist, the next server start would have created it anyway, 
        # but we can do it now to be sure.
        updates["id"] = "global"
        await db.settings.insert_one(updates)
        print("Default settings inserted.")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_phones())
