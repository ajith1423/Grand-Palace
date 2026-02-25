"""
Setup all 9 main categories and their subcategories.
Preserves existing categories and their IDs.
Adds missing subcategories as children (parent_id set to the main category ID).
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Complete category structure: 9 main categories with subcategories
CATEGORY_STRUCTURE = {
    "Sanitaryware": [
        "Water Closet", "Wash Basin", "Urinal", "Angle Valve", "Towel Rod",
        "Shower Head", "Health Faucet Kit", "Water Heater", "Bathtub",
        "Sensor Mixer", "SS WC Pan", "Soap Holder"
    ],
    "Electrical": [
        "Cable", "Wire", "PVC Conduit", "Switch", "Socket", "Isolator",
        "Insulation Tape", "Clamp Meter", "Glands and Lugs", "Junction Box", "DB Box"
    ],
    "Lightings": [
        "Chandelier", "Spot Light", "LED Strip Light", "Wall Light",
        "Ceiling Light", "Flood Light", "Tube Light", "Outdoor Lighting"
    ],
    "Safety": [
        "Fire Extinguishers", "Fire Hose and Cabinet", "Sprinklers",
        "Fire Blanket", "Fire Alarm", "Smoke Detectors", "Gas Detectors",
        "Emergency Light", "Exit Light"
    ],
    "Tools": [
        "Drilling Machine", "Angle Grinder", "Jack Hammer", "Pipe Wrench",
        "Spanner Set", "Marble Cutter", "Spirit Level", "Measuring Tape",
        "Hammer", "Pliers Set", "Screwdriver Set", "Toolbox"
    ],
    "Hardware": [
        "SS Bolt and Nut", "Hinges", "Anchor Bolt", "Masking Tape",
        "Teflon Tape", "Adhesive", "Ladder", "Platform Trolley",
        "Pallet Trolley", "Chain Block", "Silicon Gun", "Rubber Gasket",
        "Fly Net Screen", "Door Lock", "Door Handle", "Door Closer"
    ],
    "Prefab Cabins": [
        "Security Cabin", "Porta Cabin", "Prefab Toilets", "Prefab Offices"
    ],
    "Bollards": [
        "PVC Bollards", "Rubber Bollards", "Metal Bollards", "SS Bollards",
        "Bollard Chain", "Parking Bollards"
    ],
    "Automation": [
        "Gate Barriers", "Parking Management System", "Sliding Gate Automation",
        "Swing Gate Automation", "Sliding Door Automation", "Swing Door Automation",
        "Turnstile Gates", "Roller Shutters", "Access Control System", "Security Cameras"
    ]
}

# Name normalization map: maps existing DB names to reference names
# This handles cases where existing subcategory names differ slightly
NAME_NORMALIZE = {
    "Washbasin": "Wash Basin",
    "Bath Tubs": "Bathtub",
    "Faucets & Valves": None,  # Keep as-is, not in the new list
    "Bath Accessories": None,  # Keep as-is, not in the new list
    "Showers": None,           # Keep as-is, not in the new list
    "Water Heaters": "Water Heater",
}


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    # Get all existing categories
    existing = await db.categories.find({}, {"_id": 0}).to_list(200)
    existing_by_name = {c["name"]: c for c in existing}

    print("=== Existing categories ===")
    for c in existing:
        parent_label = f" (parent: {c.get('parent_id', 'none')[:8]}...)" if c.get('parent_id') else " [MAIN]"
        print(f"  {c['name']}{parent_label} -> {c['id'][:8]}...")

    added_count = 0
    kept_count = 0

    for main_cat_name, subcats in CATEGORY_STRUCTURE.items():
        # Ensure main category exists
        if main_cat_name not in existing_by_name:
            main_id = str(uuid.uuid4())
            main_doc = {
                "id": main_id,
                "name": main_cat_name,
                "description": f"{main_cat_name} products and supplies",
                "image": None,
                "icon": None,
                "parent_id": None,
                "is_active": True,
                "product_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(main_doc)
            existing_by_name[main_cat_name] = main_doc
            print(f"\n+ Created main category: {main_cat_name}")
            added_count += 1
        else:
            main_doc = existing_by_name[main_cat_name]
            # Ensure parent_id is None for main categories
            if main_doc.get("parent_id") is not None:
                await db.categories.update_one(
                    {"id": main_doc["id"]},
                    {"$set": {"parent_id": None}}
                )
                print(f"  Fixed {main_cat_name}: removed parent_id")

        parent_id = existing_by_name[main_cat_name]["id"]
        print(f"\n--- {main_cat_name} (ID: {parent_id[:8]}...) ---")

        # Add subcategories
        for sub_name in subcats:
            # Check if subcategory already exists (by name, under this parent)
            existing_sub = None
            for c in existing:
                if c.get("parent_id") == parent_id and c["name"] == sub_name:
                    existing_sub = c
                    break
                # Check normalized names
                if c.get("parent_id") == parent_id:
                    normalized = NAME_NORMALIZE.get(c["name"])
                    if normalized == sub_name:
                        existing_sub = c
                        break

            if existing_sub:
                print(f"  ✓ Already exists: {sub_name}")
                kept_count += 1
            else:
                sub_id = str(uuid.uuid4())
                sub_doc = {
                    "id": sub_id,
                    "name": sub_name,
                    "description": f"{sub_name} - {main_cat_name}",
                    "image": None,
                    "icon": None,
                    "parent_id": parent_id,
                    "is_active": True,
                    "product_count": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.categories.insert_one(sub_doc)
                print(f"  + Added: {sub_name} (ID: {sub_id[:8]}...)")
                added_count += 1

    print(f"\n=== Summary ===")
    print(f"  Kept existing: {kept_count}")
    print(f"  Added new: {added_count}")

    # Final count
    total = await db.categories.count_documents({})
    main_count = await db.categories.count_documents({"parent_id": None})
    sub_count = await db.categories.count_documents({"parent_id": {"$ne": None}})
    print(f"  Total categories: {total} ({main_count} main + {sub_count} subcategories)")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
