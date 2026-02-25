import asyncio
import os
import sys

# Add backend directory to sys.path so we can import server
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import db

async def mark_featured():
    print("Finding products...")
    cursor = db.products.find({}).limit(4)
    products = await cursor.to_list(length=4)
    
    count = 0
    for p in products:
        result = await db.products.update_one({'id': p['id']}, {'$set': {'is_featured': True}})
        if result.modified_count > 0:
            count += 1
            print(f"Marked {p['name']} as featured")
            
    print(f"\nSuccessfully marked {count} products as featured!")

if __name__ == "__main__":
    asyncio.run(mark_featured())
