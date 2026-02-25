import os
import asyncio
import httpx
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "gpgt")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

PRODUCTS = [
    {
        "sku": "GPGT-0000001",
        "brand": "JAGUAR",
        "name": "PRS-CHR-043",
        "url": "https://uae.jaquar.com/en/non-concussive-bib-tap-3",
        "description": "Auto closing bib tap with integrated control valve",
        "datasheet": "PRS-CHR-043.pdf",
        "cost": 122.0, "offer_price": 160.0, "price": 175.0,
        "stock": 5
    },
    {
        "sku": "GPGT-0000002",
        "brand": "JAGUAR",
        "name": "AQT-CHR-3057P (Blue - Cold)",
        "url": "https://uae.jaquar.com/en/angle-valve-3?Id=1937",
        "description": "Brass body angular stop valve with brass wall flange with quarter turn ceramic cartridge - Blue Mark",
        "datasheet": "30116.pdf",
        "cost": 20.0, "offer_price": 25.0, "price": 27.0,
        "stock": 2
    },
    {
        "sku": "GPGT-0000003",
        "brand": "JAGUAR",
        "name": "FLV-CHR-1089N",
        "url": "https://uae.jaquar.com/en/copy-of-code-flv-1085g-metropole-flush-valve-dual-flow-32mm-size",
        "description": "Metropole Dual Flow In-wall Flush Valve, 40mm Size",
        "datasheet": "FLV-1089.pdf",
        "cost": None, "offer_price": None, "price": None,
        "stock": 1
    },
    # SKU GPGT-0000004 already seeded
    {
        "sku": "GPGT-0000005",
        "brand": "JAGUAR",
        "name": "ZAR-CHR-150GD",
        "url": None,
        "description": "Flow Restrictor Assembly - Shattaf - Chrome Finish - 3.8 LPM",
        "datasheet": None,
        "cost": 11.0, "offer_price": 15.0, "price": 17.0,
        "stock": 91
    },
    {
        "sku": "GPGT-0000006",
        "brand": "DOCOL",
        "name": "17120106",
        "url": "https://www.docol.com.br/en/17120406-valvula-para-chuveiro-eletrico-alta-pressao-pressmatic/p?skuId=2210",
        "description": "Pressmatic High Pressure Shower Accumulation Heater Valve",
        "datasheet": "171204XX.pdf",
        "cost": 335.0, "offer_price": 435.0, "price": 465.0,
        "stock": 9
    },
    {
        "sku": "GPGT-0000007",
        "brand": "ROMA LUCE",
        "name": "6097113",
        "url": "https://romaluce.it/en/products/spotlights/crema",
        "description": "13W LED Trio CCT Recessed Spotlight - 1430lm - IP44",
        "datasheet": "1-60 spotlights_15-15.pdf",
        "cost": 150.0, "offer_price": 275.0, "price": 295.0,
        "stock": 2
    },
    {
        "sku": "GPGT-0000008",
        "brand": "ROMA LUCE",
        "name": "6074213",
        "url": "https://romaluce.it/en/products/spotlights/waterino",
        "description": "13W LED Adjustable Recessed Spotlight - 4000K - IP54",
        "datasheet": "1-60 spotlights_4-4.pdf",
        "cost": 105.0, "offer_price": 175.0, "price": 195.0,
        "stock": 4
    },
    {
        "sku": "GPGT-0000009",
        "brand": "JAGUAR",
        "name": "ZMS-CHR-543",
        "url": None,
        "description": "White face plate for OHS-459N",
        "datasheet": None,
        "cost": 4.0, "offer_price": 7.0, "price": 10.0,
        "stock": 60
    },
    {
        "sku": "GPGT-0000010",
        "brand": "PEGLER VALVE",
        "name": "Angle Valve 1\" PN-32",
        "url": "https://aalberts-ips.co.uk/products/detail/1029pt/",
        "description": None,
        "datasheet": "bronze_globe_valve.pdf",
        "cost": 225.0, "offer_price": 250.0, "price": 275.0,
        "stock": 1
    },
    {
        "sku": "GPGT-0000011",
        "brand": "EVB (CHINA BRAND)",
        "name": "Outdoor Solar Spot Light",
        "url": "https://www.desertcart.ae/products/627260865-evb-outdoor-solar-spot-light-12led-landscape-spot-light-waterproof",
        "description": "Outdoor Solar Spot Light - 12 LED - IP65",
        "datasheet": None,
        "cost": None, "offer_price": None, "price": None,
        "stock": 2
    },
    {
        "sku": "GPGT-0000012",
        "brand": "ONE LINE (CHINA BRAND)",
        "name": "Door 3-Layer Bottom Draft Seal Strip",
        "url": "https://www.noon.com/",
        "description": "Door 3-Layer Bottom Draft Seal Strip",
        "datasheet": None,
        "cost": None, "offer_price": None, "price": None,
        "stock": 2
    }
]

UPLOADS_DIR = os.path.join("uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

async def fetch_image(url: str, sku: str) -> str:
    if not url: return None
    print(f"[{sku}] Fetching image from {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
            res = await client.get(url)
            if res.status_code != 200:
                print(f"[{sku}] Failed to fetch URL, got {res.status_code}")
                return None
            
            soup = BeautifulSoup(res.text, "html.parser")
            img_url = None
            
            # Common meta tags for main product image
            og_img = soup.find("meta", property="og:image")
            if og_img and og_img.get("content"):
                img_url = og_img["content"]
            else:
                twitter_img = soup.find("meta", name="twitter:image")
                if twitter_img and twitter_img.get("content"):
                    img_url = twitter_img["content"]
            
            # Specific site logic
            if not img_url and 'docol' in url:
                primary = soup.find('img', class_='vtex-store-components-3-x-productImageTag')
                if primary: img_url = primary.get('src')
            if not img_url and 'romaluce' in url:
                primary = soup.find('img', class_='product__image')
                if primary: img_url = primary.get('src')
                
            if not img_url:
                print(f"[{sku}] Could not find main image tag on page.")
                return None
            
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            elif img_url.startswith("/"):
                # Rough fix for absolute path
                base_url = "/".join(url.split("/")[:3])
                img_url = base_url + img_url
                
            print(f"[{sku}] Found image URL: {img_url}. Downloading...")
            img_res = await client.get(img_url)
            if img_res.status_code == 200:
                filename = f"{sku}.jpg"
                filepath = os.path.join(UPLOADS_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(img_res.content)
                print(f"[{sku}] Successfully downloaded {filename}!")
                return f"/api/uploads/{filename}"
            else:
                print(f"[{sku}] Failed to download the image file, got {img_res.status_code}")
    except Exception as e:
        print(f"[{sku}] Error downloading image: {e}")
    return None

async def seed_products():
    brand_cat_map = {
        "JAGUAR": "cat_sanitaryware",
        "DOCOL": "cat_sanitaryware",
        "ROMA LUCE": "cat_lightings",
        "PEGLER VALVE": "cat_hardware",
        "EVB (CHINA BRAND)": "cat_lightings",
        "ONE LINE (CHINA BRAND)": "cat_hardware",
        "DEFAULT": "cat_hardware"
    }

    print("Checking connection to GPGT database...")
    count = await db.products.count_documents({})
    print(f"Found {count} existing products in DB.")

    for p in PRODUCTS:
        # Check if already exists to skip re-downloading images
        existing = await db.products.find_one({"sku": p["sku"]})
        
        img_url = None
        if existing and existing.get("images") and existing["images"][0].startswith("/api/uploads/"):
             img_url = existing["images"][0]
             print(f"[{p['sku']}] Skipping image download, already exists locally as {img_url}")
        else:
             img_url = await fetch_image(p["url"], p["sku"])
             
        images = [img_url] if img_url else []

        doc = {
            "name": p["name"],
            "brand": p["brand"],
            "description": p["description"] or "",
            "price": float(p["price"]) if p["price"] is not None else 0.0,
            "offer_price": float(p["offer_price"]) if p["offer_price"] is not None else 0.0,
            "cost": float(p["cost"]) if p["cost"] is not None else 0.0,
            "stock": p["stock"],
            "sku": p["sku"],
            "category_id": brand_cat_map.get(p["brand"], brand_cat_map["DEFAULT"]),
            "images": images,
            "is_active": True,
            "is_featured": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        # Add datasheet to highlights/specifications if present
        if p["datasheet"]:
            doc["specifications"] = {"Datasheet": p["datasheet"]}
            doc["highlights"] = [f"Datasheet Available: {p['datasheet']}"]
        
        if existing:
            await db.products.update_one({"sku": p["sku"]}, {"$set": doc})
            print(f"Updated product: {p['sku']} - {p['name']}")
        else:
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.insert_one(doc)
            print(f"Created new product: {p['sku']} - {p['name']}")
    
    print("All products processed!")

if __name__ == "__main__":
    asyncio.run(seed_products())
