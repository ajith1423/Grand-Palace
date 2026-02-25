import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "gpgt_db")

print(f"Connecting to MongoDB at {MONGO_URL}...")

async def create_indexes():
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    
    try:
        # Check connection
        await client.server_info()
        print("Successfully connected to MongoDB.")
        
        # 1. Products Collection Indexes
        print("Creating indexes for 'products' collection...")
        products = db.products
        
        # Index on category for faster filtering
        await products.create_index([("category_id", pymongo.ASCENDING)])
        
        # Index on status and featured for storefront queries
        await products.create_index([("is_active", pymongo.ASCENDING)])
        await products.create_index([("is_featured", pymongo.ASCENDING)])
        
        # Index on SKU for quick lookups
        await products.create_index([("sku", pymongo.ASCENDING)])
        
        # Compound index for product listing page
        await products.create_index([
            ("is_active", pymongo.ASCENDING), 
            ("category_id", pymongo.ASCENDING)
        ])
        
        # 2. Orders Collection Indexes
        print("Creating indexes for 'orders' collection...")
        orders = db.orders
        
        # Index on user_id for faster order history queries
        await orders.create_index([("user_id", pymongo.ASCENDING)])
        
        # Index on status for faster admin dashboard queries
        await orders.create_index([("status", pymongo.ASCENDING)])
        
        # Index on order_number for tracking
        await orders.create_index([("order_number", pymongo.ASCENDING)])
        
        # 3. Users Collection Indexes
        print("Creating indexes for 'users' collection...")
        users = db.users
        
        # Drop existing sparse indexes to re-create with partialFilterExpression
        try:
            await users.drop_index("email_1")
        except pymongo.errors.OperationFailure:
            pass
            
        try:
            await users.drop_index("phone_1")
        except pymongo.errors.OperationFailure:
            pass
        
        # Unique index on email and phone using partial filter to ignore null values
        await users.create_index(
            [("email", pymongo.ASCENDING)], 
            unique=True, 
            partialFilterExpression={"email": {"$type": "string", "$exists": True}}
        )
        await users.create_index(
            [("phone", pymongo.ASCENDING)], 
            unique=True, 
            partialFilterExpression={"phone": {"$type": "string", "$exists": True}}
        )
        
        # 4. Enquiries & Reviews
        print("Creating secondary collection indexes...")
        if "enquiries" in await db.list_collection_names():
            await db.enquiries.create_index([("status", pymongo.ASCENDING)])
        
        if "reviews" in await db.list_collection_names():
            await db.reviews.create_index([("product_id", pymongo.ASCENDING)])
            
        print("\n✅ All recommended database indexes created successfully!")
        print("These indexes will significantly speed up database query performance.")
        
    except pymongo.errors.ServerSelectionTimeoutError as e:
        print(f"\n❌ Error connecting to MongoDB: {e}")
        print("Ensure MongoDB is running and MONGO_URL in .env is correct.")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())
