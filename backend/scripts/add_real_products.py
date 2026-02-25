#!/usr/bin/env python3
"""
Script to add real products from the extracted document links.
Run with: python3 /app/backend/scripts/add_real_products.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Category IDs from the database
CATEGORIES = {
    "Sanitaryware": "2c578103-6b53-4c5f-a35f-3b1ea807025f",
    "Electrical": "c0dc0171-d9ca-4e95-9c15-1c2825650ff9",
    "Hardware": "31226712-29cb-4659-8738-a99d8bda0a47",
    "Prefab Cabins": "5d46f6ac-f4a0-4b55-af4e-358914ca8737",
}

# Real products extracted from the documents
REAL_PRODUCTS = [
    # ========== SANITARYWARE PRODUCTS ==========
    {
        "name": "Automatic Rimless Floor Mounted WC with Bidspa",
        "description": "Premium automatic rimless floor mounted water closet with integrated bidet spa function. Features advanced flushing technology for superior hygiene and water efficiency. Modern design with high-quality ceramic construction.",
        "price": 2499.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-WC-001",
        "stock": 25,
        "images": [
            "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Automatic rimless flushing technology",
            "Integrated bidet spa function",
            "Water-efficient design",
            "Premium ceramic construction",
            "Easy-clean coating"
        ],
        "specifications": {
            "Material": "Premium Grade Ceramic",
            "Flush Type": "Automatic Rimless",
            "Water Consumption": "4.5L / 3L dual flush",
            "Installation": "Floor Mounted",
            "Color": "White",
            "Warranty": "10 Years"
        },
        "source_url": "https://uae.jaquar.com/en/automatic-rimless-floor-mounted-wc-bidspa?Id=4596"
    },
    {
        "name": "Wall Hung Basin",
        "description": "Elegant wall hung wash basin with contemporary design. Perfect for modern bathrooms with space-saving installation. Made from high-quality vitreous china with smooth finish.",
        "price": 899.00,
        "offer_price": 749.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-WB-001",
        "stock": 40,
        "images": [
            "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Space-saving wall mounted design",
            "Contemporary styling",
            "Easy maintenance",
            "Overflow protection",
            "Anti-bacterial glaze"
        ],
        "specifications": {
            "Material": "Vitreous China",
            "Mounting": "Wall Hung",
            "Dimensions": "60 x 45 cm",
            "Color": "Glossy White",
            "Warranty": "7 Years"
        },
        "source_url": "https://uae.jaquar.com/en/wall-hung-basin-10?Id=21027"
    },
    {
        "name": "Urinal Back Inlet",
        "description": "Commercial grade urinal with back inlet design. Suitable for offices, malls, and public restrooms. Water-efficient with sleek modern appearance.",
        "price": 599.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-UR-001",
        "stock": 30,
        "images": [
            "https://images.unsplash.com/photo-1564540583246-934409427776?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Back inlet design",
            "Commercial grade quality",
            "Water-efficient",
            "Easy installation",
            "Stain-resistant surface"
        ],
        "specifications": {
            "Material": "Ceramic",
            "Inlet Type": "Back Inlet",
            "Dimensions": "385 x 325 x 635 mm",
            "Color": "White",
            "Warranty": "5 Years"
        },
        "source_url": "https://uae.jaquar.com/en/urinal-back-inlet-385x325x635-mm?Id=58"
    },
    {
        "name": "Angular Stop Cock",
        "description": "Premium quality angular stop cock for water supply control. Durable brass construction with chrome finish. Essential component for bathroom and kitchen installations.",
        "price": 89.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-AC-001",
        "stock": 100,
        "images": [
            "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Quarter turn operation",
            "Brass body construction",
            "Chrome plated finish",
            "Leak-proof design",
            "Universal fitting"
        ],
        "specifications": {
            "Material": "Brass",
            "Finish": "Chrome",
            "Size": "15mm",
            "Pressure Rating": "16 bar",
            "Warranty": "5 Years"
        },
        "source_url": "https://uae.jaquar.com/en/cat-no-sol-6053-angular-stop-cock"
    },
    {
        "name": "Towel Rail 300mm",
        "description": "Stylish towel rail with 300mm length. Perfect for organizing towels in bathrooms. Made from premium stainless steel with chrome finish for durability.",
        "price": 129.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-TR-001",
        "stock": 80,
        "images": [
            "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Premium stainless steel",
            "Chrome finish",
            "Easy wall mounting",
            "Corrosion resistant",
            "Modern design"
        ],
        "specifications": {
            "Material": "Stainless Steel",
            "Finish": "Chrome",
            "Length": "300mm",
            "Load Capacity": "5 kg",
            "Warranty": "3 Years"
        },
        "source_url": "https://uae.jaquar.com/en/acn-1101n-towel-rail-300mm-long"
    },
    {
        "name": "Overhead Shower",
        "description": "Luxurious overhead shower with multiple spray patterns. Large shower face provides full body coverage. Chrome finish for modern aesthetics.",
        "price": 349.00,
        "offer_price": 299.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-OS-001",
        "stock": 45,
        "images": [
            "https://images.unsplash.com/photo-1629774631753-88f827bf6447?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Multiple spray patterns",
            "Large shower face",
            "Anti-limescale nozzles",
            "Easy clean function",
            "Water-saving technology"
        ],
        "specifications": {
            "Material": "ABS/Chrome",
            "Diameter": "200mm",
            "Spray Patterns": "3 Modes",
            "Flow Rate": "12 L/min",
            "Warranty": "5 Years"
        },
        "source_url": "https://uae.jaquar.com/en/overhead-shower-ohs-1805"
    },
    {
        "name": "Health Faucet Kit",
        "description": "Complete health faucet kit with hand shower, hose, and wall hook. Essential for personal hygiene. High-quality construction with chrome finish.",
        "price": 149.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-HF-001",
        "stock": 60,
        "images": [
            "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Complete kit included",
            "Ergonomic handle design",
            "Flexible 1.2m hose",
            "Wall hook included",
            "Easy installation"
        ],
        "specifications": {
            "Material": "ABS/Brass",
            "Finish": "Chrome",
            "Hose Length": "1.2m",
            "Pressure Rating": "10 bar",
            "Warranty": "3 Years"
        },
        "source_url": "https://uae.jaquar.com/en/health-faucet-kit?Id=1923"
    },
    {
        "name": "Versa Horizontal Water Heater",
        "description": "Energy-efficient horizontal water heater with manual controls. Compact design suitable for various installation spaces. Superior insulation for heat retention.",
        "price": 799.00,
        "offer_price": 699.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-WH-001",
        "stock": 20,
        "images": [
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Horizontal installation",
            "Energy efficient",
            "Superior insulation",
            "Temperature control",
            "Safety thermostat"
        ],
        "specifications": {
            "Capacity": "30 Liters",
            "Power": "2000W",
            "Voltage": "220-240V",
            "Installation": "Horizontal",
            "Warranty": "5 Years"
        },
        "source_url": "https://uae.jaquar.com/en/versa-horizontal-manual-e"
    },
    {
        "name": "Alive Built-in Bathtub",
        "description": "Luxurious built-in bathtub with ergonomic design for ultimate relaxation. Made from premium acrylic with reinforced fiberglass. Perfect centerpiece for master bathrooms.",
        "price": 4999.00,
        "offer_price": 4499.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-BT-001",
        "stock": 10,
        "images": [
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Ergonomic design",
            "Premium acrylic material",
            "Reinforced fiberglass",
            "Built-in armrests",
            "Anti-slip surface"
        ],
        "specifications": {
            "Material": "Acrylic",
            "Dimensions": "170 x 75 x 55 cm",
            "Capacity": "200 Liters",
            "Color": "White",
            "Warranty": "10 Years"
        },
        "source_url": "https://uae.jaquar.com/en/alive-built-in-bathtub?Id=2425"
    },
    {
        "name": "Soap Dish Holder",
        "description": "Elegant soap dish holder with chrome finish. Wall-mounted design saves counter space. Durable construction with drainage holes.",
        "price": 79.00,
        "category_id": CATEGORIES["Sanitaryware"],
        "sku": "SAN-SD-001",
        "stock": 90,
        "images": [
            "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800"
        ],
        "brand": "Jaquar",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Wall mounted design",
            "Drainage holes",
            "Chrome finish",
            "Easy installation",
            "Rust resistant"
        ],
        "specifications": {
            "Material": "Brass/Glass",
            "Finish": "Chrome",
            "Mounting": "Wall",
            "Dimensions": "12 x 10 cm",
            "Warranty": "3 Years"
        },
        "source_url": "https://uae.jaquar.com/en/acn-1131n-soap-dish-holder"
    },
    
    # ========== ELECTRICAL PRODUCTS ==========
    {
        "name": "FLAMBICC ANZ 0.6/1KV Class 5 Core 4 Cable",
        "description": "High-quality electrical cable suitable for industrial and commercial installations. Class 5 flexible conductor for easy installation. Meets international safety standards.",
        "price": 299.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-CB-001",
        "stock": 150,
        "images": [
            "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800"
        ],
        "brand": "Ducab",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "0.6/1KV voltage rating",
            "Class 5 flexible conductor",
            "4 core configuration",
            "Industrial grade quality",
            "Fire resistant"
        ],
        "specifications": {
            "Voltage Rating": "0.6/1KV",
            "Conductor Class": "Class 5",
            "Cores": "4",
            "Insulation": "PVC",
            "Standard": "IEC 60502-1"
        },
        "source_url": "https://auwebapp.azurewebsites.net/product/flambicc-anz-061kv-class-5-core-4ce"
    },
    {
        "name": "LV Wiring Cable DuFlex",
        "description": "Premium low voltage wiring cable from Ducab. DuFlex series offers excellent flexibility and durability. Ideal for residential and commercial electrical installations.",
        "price": 189.00,
        "offer_price": 159.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-WR-001",
        "stock": 200,
        "images": [
            "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800"
        ],
        "brand": "Ducab",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Low smoke emission",
            "Halogen free",
            "Flexible design",
            "Fire retardant",
            "UAE made"
        ],
        "specifications": {
            "Type": "DuFlex/DuPan/SmokeMaster",
            "Voltage": "450/750V",
            "Conductor": "Copper",
            "Insulation": "LSZH",
            "Standard": "BS 6004"
        },
        "source_url": "https://ducab.com/product/lv-wiring-cables-duflex-dupan-smokemaster/"
    },
    {
        "name": "PVC Conduit for Electrical Cabling",
        "description": "Heavy-duty PVC conduit for electrical cable protection. Suitable for industrial and commercial purposes. UV resistant and impact resistant construction.",
        "price": 45.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-CD-001",
        "stock": 300,
        "images": [
            "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800"
        ],
        "brand": "RACO",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "UV resistant",
            "Impact resistant",
            "Easy installation",
            "Self-extinguishing",
            "Electrical insulation"
        ],
        "specifications": {
            "Material": "PVC",
            "Size": "25mm",
            "Length": "3m",
            "Color": "Grey",
            "Standard": "AS/NZS 2053"
        },
        "source_url": "https://www.amazon.ae/RACO-Elctrical-Cablling-Industrial-Purposes/dp/B0BTSW67J6"
    },
    {
        "name": "MK Electric Aspect Switch",
        "description": "Premium electrical switch from Honeywell MK Electric Aspect series. Modern design with superior quality. Available in multiple finishes for interior matching.",
        "price": 89.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-SW-001",
        "stock": 150,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ],
        "brand": "Honeywell",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Premium quality",
            "Modern design",
            "Multiple finishes available",
            "Easy installation",
            "25 year warranty"
        ],
        "specifications": {
            "Series": "Aspect",
            "Rating": "10A 250V",
            "Gang": "1 Gang",
            "Type": "1 Way/2 Way",
            "Warranty": "25 Years"
        },
        "source_url": "https://buildings.honeywell.com/ae/en/brands/our-brands/mk-electric/products/aspect"
    },
    {
        "name": "Socket Module",
        "description": "High-quality socket module from Honeywell. Designed for residential and commercial installations. Safety shutters for child protection.",
        "price": 69.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-SK-001",
        "stock": 180,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ],
        "brand": "Honeywell",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Safety shutters",
            "Child protection",
            "Easy installation",
            "Fire resistant",
            "UK/UAE standard"
        ],
        "specifications": {
            "Type": "3 Pin Socket",
            "Rating": "13A 250V",
            "Standard": "BS 1363",
            "Material": "Polycarbonate",
            "Warranty": "25 Years"
        },
        "source_url": "https://buildings.honeywell.com/ae/en/products/by-category/electrical-and-wiring/wiring-devices/sockets/socket-modules"
    },
    {
        "name": "Electrical Isolator",
        "description": "Professional grade electrical isolator switch for safety disconnection. Essential for maintenance and emergency situations. Robust construction for industrial use.",
        "price": 149.00,
        "category_id": CATEGORIES["Electrical"],
        "sku": "ELE-IS-001",
        "stock": 75,
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
        ],
        "brand": "Honeywell",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Safety disconnection",
            "Industrial grade",
            "IP65 rating",
            "Lockable design",
            "Clear ON/OFF indication"
        ],
        "specifications": {
            "Rating": "32A",
            "Poles": "4 Pole",
            "IP Rating": "IP65",
            "Breaking Capacity": "6kA",
            "Standard": "IEC 60947"
        },
        "source_url": "https://buildings.honeywell.com/ae/en/search-results?docType=Product&search=Isolator"
    },
    
    # ========== HARDWARE PRODUCTS ==========
    {
        "name": "Solid Lever Handle EL-CMH8803",
        "description": "Premium solid lever door handle with elegant design. Suitable for interior doors in residential and commercial buildings. Heavy-duty construction for long-lasting performance.",
        "price": 199.00,
        "offer_price": 169.00,
        "category_id": CATEGORIES["Hardware"],
        "sku": "HW-DH-001",
        "stock": 60,
        "images": [
            "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800"
        ],
        "brand": "Elock",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Solid construction",
            "Elegant design",
            "Heavy duty",
            "Easy installation",
            "Corrosion resistant"
        ],
        "specifications": {
            "Material": "Zinc Alloy",
            "Finish": "Satin Nickel",
            "Type": "Lever Handle",
            "Backset": "60mm/70mm",
            "Warranty": "3 Years"
        }
    },
    {
        "name": "EM Lock 1200 Lbs",
        "description": "High-security electromagnetic door lock with 1200 lbs holding force. Professional access control solution for offices and commercial buildings. Unmonitored type without LED indicator.",
        "price": 349.00,
        "category_id": CATEGORIES["Hardware"],
        "sku": "HW-DL-001",
        "stock": 35,
        "images": [
            "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800"
        ],
        "brand": "Elock",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "1200 lbs holding force",
            "Fail-safe operation",
            "Low power consumption",
            "Surface or flush mount",
            "Access control compatible"
        ],
        "specifications": {
            "Holding Force": "1200 lbs",
            "Voltage": "12V/24V DC",
            "Current": "500mA/250mA",
            "Type": "Unmonitored",
            "Warranty": "2 Years"
        }
    },
    {
        "name": "Panic Bolt Replacement Chain and Hammer",
        "description": "Replacement hammer and chain kit for panic bolts. Essential spare part for emergency exit hardware maintenance. High-quality steel construction.",
        "price": 45.00,
        "category_id": CATEGORIES["Hardware"],
        "sku": "HW-CB-001",
        "stock": 100,
        "images": [
            "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800"
        ],
        "brand": "Generic",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Universal fit",
            "High-quality steel",
            "Easy replacement",
            "Emergency compliance",
            "Durable construction"
        ],
        "specifications": {
            "Material": "Steel",
            "Type": "HC1",
            "Compatibility": "Standard Panic Bolts",
            "Color": "Red/Chrome"
        }
    },
    {
        "name": "Screwdriver Kit 8-in-1",
        "description": "Versatile 8-in-1 screwdriver kit for various applications. Multiple bit sizes and types included. Ergonomic handle for comfortable use.",
        "price": 35.00,
        "category_id": CATEGORIES["Hardware"],
        "sku": "HW-SK-001",
        "stock": 150,
        "images": [
            "https://images.unsplash.com/photo-1745449563046-f75d0bd28f46?w=800"
        ],
        "brand": "Tata Agrico",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "8 different bits",
            "Ergonomic handle",
            "Compact storage",
            "Chrome vanadium steel",
            "Multi-purpose use"
        ],
        "specifications": {
            "Pieces": "8-in-1",
            "Material": "Chrome Vanadium",
            "Handle": "Ergonomic Grip",
            "Storage": "Built-in",
            "Warranty": "1 Year"
        }
    },
    
    # ========== PREFAB CABIN PRODUCTS ==========
    {
        "name": "Portable Toilet",
        "description": "High-quality portable toilet suitable for construction sites, events, and outdoor locations. Easy to transport and set up. Includes ventilation and hand sanitizer dispenser.",
        "price": 2999.00,
        "offer_price": 2499.00,
        "category_id": CATEGORIES["Prefab Cabins"],
        "sku": "PF-PT-001",
        "stock": 15,
        "images": [
            "https://images.unsplash.com/photo-1555852435-cd0a2c2c2c95?w=800"
        ],
        "brand": "FTM Prefab",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Easy transport",
            "Quick setup",
            "Ventilation system",
            "Hand sanitizer included",
            "Durable construction"
        ],
        "specifications": {
            "Dimensions": "120 x 120 x 230 cm",
            "Material": "HDPE/Fiberglass",
            "Tank Capacity": "250 Liters",
            "Weight": "120 kg",
            "Color": "Grey/Blue"
        },
        "source_url": "https://ftmprefab.com/product/portable-toilets-for-rent/"
    },
    {
        "name": "Portable Site Office",
        "description": "Ready-to-use portable office cabin for construction sites. Fully insulated with electrical fittings. Air conditioning ready. Multiple window and door configurations available.",
        "price": 12999.00,
        "offer_price": 10999.00,
        "category_id": CATEGORIES["Prefab Cabins"],
        "sku": "PF-PO-001",
        "stock": 8,
        "images": [
            "https://images.unsplash.com/photo-1555852435-cd0a2c2c2c95?w=800"
        ],
        "brand": "FTM Prefab",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "Fully insulated",
            "Electrical fittings included",
            "AC ready",
            "Multiple configurations",
            "Quick installation"
        ],
        "specifications": {
            "Dimensions": "6 x 3 x 2.6 m",
            "Frame": "Galvanized Steel",
            "Wall": "Sandwich Panel",
            "Floor": "Vinyl/Ceramic",
            "Windows": "Aluminum Sliding"
        },
        "source_url": "https://ftmprefab.com/product/portable-office-site-uae/"
    },
    {
        "name": "Porta Cabin Standard",
        "description": "Standard porta cabin for various applications including accommodation, storage, and office use. Weather resistant and durable construction. Customizable interior layout.",
        "price": 8999.00,
        "category_id": CATEGORIES["Prefab Cabins"],
        "sku": "PF-PC-001",
        "stock": 12,
        "images": [
            "https://images.unsplash.com/photo-1555852435-cd0a2c2c2c95?w=800"
        ],
        "brand": "FTM Prefab",
        "is_active": True,
        "is_featured": False,
        "highlights": [
            "Multi-purpose use",
            "Weather resistant",
            "Customizable layout",
            "Easy relocation",
            "Cost effective"
        ],
        "specifications": {
            "Dimensions": "6 x 2.4 x 2.6 m",
            "Frame": "Steel",
            "Wall": "Sandwich Panel 50mm",
            "Roof": "Insulated Panel",
            "Door": "Steel Security Door"
        },
        "source_url": "https://ftmprefab.com/product/porta-cabins/"
    },
    {
        "name": "Security Cabin",
        "description": "Professional security cabin for entrance gates and checkpoints. Compact design with excellent visibility. Built-in counter and storage space.",
        "price": 5999.00,
        "offer_price": 4999.00,
        "category_id": CATEGORIES["Prefab Cabins"],
        "sku": "PF-SC-001",
        "stock": 20,
        "images": [
            "https://images.unsplash.com/photo-1555852435-cd0a2c2c2c95?w=800"
        ],
        "brand": "FTM Prefab",
        "is_active": True,
        "is_featured": True,
        "highlights": [
            "360° visibility",
            "Built-in counter",
            "AC ready",
            "Secure locking",
            "Weather resistant"
        ],
        "specifications": {
            "Dimensions": "1.5 x 1.5 x 2.3 m",
            "Frame": "Aluminum/Steel",
            "Glass": "Tinted/Clear",
            "Floor": "Anti-fatigue Mat",
            "Door": "Sliding/Swing"
        },
        "source_url": "https://ftmprefab.com/product/security-cabins/"
    }
]


async def add_products():
    """Add the real products to the database"""
    print("Starting to add real products...")
    
    # First, optionally clear existing dummy products
    # Uncomment the next line if you want to delete all existing products first
    # await db.products.delete_many({})
    
    added_count = 0
    updated_count = 0
    
    for product_data in REAL_PRODUCTS:
        # Check if product already exists by SKU
        existing = await db.products.find_one({"sku": product_data["sku"]})
        
        product_doc = {
            **product_data,
            "average_rating": 0,
            "review_count": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remove source_url from the document (just for reference)
        product_doc.pop("source_url", None)
        
        if existing:
            # Update existing product
            await db.products.update_one(
                {"sku": product_data["sku"]},
                {"$set": product_doc}
            )
            updated_count += 1
            print(f"Updated: {product_data['name']}")
        else:
            # Create new product
            product_doc["id"] = str(uuid.uuid4())
            product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.insert_one(product_doc)
            added_count += 1
            print(f"Added: {product_data['name']}")
    
    # Update category product counts
    for cat_name, cat_id in CATEGORIES.items():
        count = await db.products.count_documents({"category_id": cat_id})
        await db.categories.update_one({"id": cat_id}, {"$set": {"product_count": count}})
        print(f"Category '{cat_name}': {count} products")
    
    print(f"\nDone! Added: {added_count}, Updated: {updated_count}")


if __name__ == "__main__":
    asyncio.run(add_products())
