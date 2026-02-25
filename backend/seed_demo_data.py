"""
Seed Demo Data Script
Populates the database with realistic demo data for client presentations.
Includes: Orders, Invoices, Enquiries, Notifications, and Customers.

Usage: python seed_demo_data.py
"""

import asyncio
import os
import random
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ── Helper Functions ──────────────────────────────────────────────────
def gen_id():
    return str(uuid.uuid4())

def past_date(days_ago, hour=10):
    return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 12))

def gen_phone():
    return f"+971 5{random.randint(0,9)} {random.randint(100,999)} {random.randint(1000,9999)}"


# ── Demo Customers ────────────────────────────────────────────────────
DEMO_CUSTOMERS = [
    {"name": "Mohammed Al Rashid", "email": "mohammed.rashid@email.com", "phone": "+971 50 123 4567", "emirate": "Dubai"},
    {"name": "Fatima Hassan", "email": "fatima.hassan@email.com", "phone": "+971 55 234 5678", "emirate": "Abu Dhabi"},
    {"name": "Ahmed Khalil", "email": "ahmed.khalil@email.com", "phone": "+971 52 345 6789", "emirate": "Sharjah"},
    {"name": "Sara Al Maktoum", "email": "sara.maktoum@email.com", "phone": "+971 56 456 7890", "emirate": "Dubai"},
    {"name": "Omar Ibrahim", "email": "omar.ibrahim@email.com", "phone": "+971 54 567 8901", "emirate": "Ajman"},
    {"name": "Layla Abdulla", "email": "layla.abdulla@email.com", "phone": "+971 50 678 9012", "emirate": "Ras Al Khaimah"},
    {"name": "Khalid Mohammed", "email": "khalid.m@email.com", "phone": "+971 55 789 0123", "emirate": "Dubai"},
    {"name": "Noor Al Ain", "email": "noor.alain@email.com", "phone": "+971 52 890 1234", "emirate": "Fujairah"},
    {"name": "Rashid Enterprises LLC", "email": "procurement@rashid-ent.ae", "phone": "+971 4 234 5678", "emirate": "Dubai"},
    {"name": "Emirates Contracting Co.", "email": "orders@ecc-uae.com", "phone": "+971 4 345 6789", "emirate": "Abu Dhabi"},
]

ADDRESSES = [
    {"address_line1": "Villa 23, Al Wasl Road", "city": "Dubai", "emirate": "Dubai"},
    {"address_line1": "Office 401, Al Reem Tower", "city": "Abu Dhabi", "emirate": "Abu Dhabi"},
    {"address_line1": "Warehouse 7, Industrial Area 3", "city": "Sharjah", "emirate": "Sharjah"},
    {"address_line1": "Flat 12B, Marina Walk", "city": "Dubai", "emirate": "Dubai"},
    {"address_line1": "Shop 5, City Centre Mall", "city": "Ajman", "emirate": "Ajman"},
    {"address_line1": "Block C, Business Bay", "city": "Dubai", "emirate": "Dubai"},
    {"address_line1": "Tower A, Corniche Road", "city": "Abu Dhabi", "emirate": "Abu Dhabi"},
    {"address_line1": "Unit 9, Al Nakheel Area", "city": "Ras Al Khaimah", "emirate": "Ras Al Khaimah"},
]


async def get_products():
    """Fetch existing products from DB to use in orders."""
    products = []
    async for p in db.products.find({"is_active": True}).limit(20):
        products.append({
            "id": str(p["_id"]) if "_id" in p else p.get("id", gen_id()),
            "name": p["name"],
            "price": p.get("price", 0),
            "offer_price": p.get("offer_price"),
            "sku": p.get("sku", ""),
            "images": p.get("images", []),
        })
    return products


async def seed_customers():
    """Create demo customer accounts."""
    print("📋 Seeding customers...")
    customers_created = 0
    hashed_pw = bcrypt.hashpw("Demo@12345".encode(), bcrypt.gensalt()).decode()

    for c in DEMO_CUSTOMERS:
        existing = await db.users.find_one({"email": c["email"]})
        if existing:
            continue
        user = {
            "id": gen_id(),
            "name": c["name"],
            "email": c["email"],
            "phone": c["phone"],
            "password_hash": hashed_pw,
            "role": "customer",
            "is_verified": True,
            "created_at": past_date(random.randint(5, 60)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
        customers_created += 1
    print(f"   ✅ {customers_created} customers created")


async def seed_orders(products):
    """Create demo orders with various statuses."""
    print("📦 Seeding orders...")
    statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "delivered", "cancelled"]
    payment_methods = ["cod", "stripe", "stripe", "cod"]
    orders_created = 0

    for i in range(12):
        customer = random.choice(DEMO_CUSTOMERS)
        addr = random.choice(ADDRESSES)
        status = statuses[i % len(statuses)]
        payment_method = random.choice(payment_methods)
        days_ago = random.randint(0, 30)

        # Pick 1-4 products
        num_items = random.randint(1, min(4, len(products)))
        selected = random.sample(products, num_items) if len(products) >= num_items else products[:num_items]

        items = []
        subtotal = 0
        for p in selected:
            qty = random.randint(1, 3)
            price = p.get("offer_price") or p["price"]
            item_total = price * qty
            subtotal += item_total
            items.append({
                "product_id": p["id"],
                "product_name": p["name"],
                "sku": p["sku"],
                "quantity": qty,
                "unit_price": price,
                "total_price": item_total,
                "image": p["images"][0] if p["images"] else None,
            })

        vat_amount = round(subtotal * 0.05, 2)
        shipping_cost = 0 if subtotal > 500 else 25
        total = round(subtotal + vat_amount + shipping_cost, 2)

        order = {
            "id": gen_id(),
            "order_number": f"GP-{2025}{str(i+1).zfill(4)}",
            "user_id": gen_id(),
            "customer_name": customer["name"],
            "customer_email": customer["email"],
            "customer_phone": customer["phone"],
            "items": items,
            "subtotal": round(subtotal, 2),
            "vat_amount": vat_amount,
            "shipping_cost": shipping_cost,
            "total": total,
            "status": status,
            "payment_method": payment_method,
            "payment_status": "paid" if (payment_method == "stripe" or status == "delivered") else "pending",
            "shipping_address": {
                "full_name": customer["name"],
                "phone": customer["phone"],
                "address_line1": addr["address_line1"],
                "city": addr["city"],
                "emirate": addr["emirate"],
                "country": "United Arab Emirates",
            },
            "notes": random.choice(["", "", "Please deliver before 5pm", "Call before delivery", "Leave at reception", ""]),
            "created_at": past_date(days_ago).isoformat(),
            "updated_at": past_date(max(0, days_ago - random.randint(0, 3))).isoformat(),
        }

        # Add timeline
        timeline = [{"status": "pending", "timestamp": order["created_at"], "note": "Order placed"}]
        if status in ["confirmed", "processing", "shipped", "delivered"]:
            timeline.append({"status": "confirmed", "timestamp": past_date(max(0, days_ago - 1)).isoformat(), "note": "Order confirmed"})
        if status in ["processing", "shipped", "delivered"]:
            timeline.append({"status": "processing", "timestamp": past_date(max(0, days_ago - 2)).isoformat(), "note": "Order being processed"})
        if status in ["shipped", "delivered"]:
            timeline.append({"status": "shipped", "timestamp": past_date(max(0, days_ago - 3)).isoformat(), "note": "Shipped via Emirates Express"})
        if status == "delivered":
            timeline.append({"status": "delivered", "timestamp": past_date(max(0, days_ago - 5)).isoformat(), "note": "Delivered successfully"})
        if status == "cancelled":
            timeline.append({"status": "cancelled", "timestamp": past_date(max(0, days_ago - 1)).isoformat(), "note": "Cancelled by customer"})
        order["timeline"] = timeline

        await db.orders.insert_one(order)
        orders_created += 1

    print(f"   ✅ {orders_created} orders created")


async def seed_enquiries(products):
    """Create demo product and cart enquiries."""
    print("💬 Seeding enquiries...")

    # Product Enquiries
    product_enquiry_messages = [
        "I need bulk pricing for 50 units. Can you provide a quotation?",
        "Is this item available in chrome finish? What's the delivery time?",
        "We are looking for 20 units for our hotel project. Discount available?",
        "Can you provide the technical specifications sheet for this product?",
        "Is installation service available for this product in Dubai?",
        "What's the warranty period? Do you have a service center in Abu Dhabi?",
    ]

    prod_count = 0
    for i, msg in enumerate(product_enquiry_messages):
        product = random.choice(products) if products else None
        customer = random.choice(DEMO_CUSTOMERS)
        status = random.choice(["new", "new", "pending", "responded", "closed"])

        enquiry = {
            "id": gen_id(),
            "type": "product",
            "name": customer["name"],
            "email": customer["email"],
            "phone": customer["phone"],
            "product_id": product["id"] if product else None,
            "product_name": product["name"] if product else "General Inquiry",
            "quantity": random.choice([1, 5, 10, 20, 50]),
            "message": msg,
            "status": status,
            "created_at": past_date(random.randint(0, 15)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.enquiries.insert_one(enquiry)
        prod_count += 1

    # Cart Enquiries
    cart_count = 0
    cart_messages = [
        "Need quotation for complete bathroom set for villa project.",
        "Requesting pricing for office renovation - 15 washbasins.",
        "Can you deliver to Fujairah? Need all items within 2 weeks.",
    ]

    for i, msg in enumerate(cart_messages):
        customer = random.choice(DEMO_CUSTOMERS)
        num_items = random.randint(2, 4)
        selected = random.sample(products, min(num_items, len(products))) if products else []

        cart_items = []
        for p in selected:
            qty = random.randint(1, 10)
            cart_items.append({
                "product_id": p["id"],
                "product_name": p["name"],
                "name": p["name"],
                "quantity": qty,
                "unit_price": p.get("offer_price") or p["price"],
            })

        enquiry = {
            "id": gen_id(),
            "type": "cart",
            "name": customer["name"],
            "email": customer["email"],
            "phone": customer["phone"],
            "items": cart_items,
            "message": msg,
            "status": random.choice(["new", "new", "pending", "responded"]),
            "created_at": past_date(random.randint(0, 10)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.cart_enquiries.insert_one(enquiry)
        cart_count += 1

    print(f"   ✅ {prod_count} product enquiries + {cart_count} cart enquiries created")


async def seed_notifications():
    """Create demo notifications."""
    print("🔔 Seeding notifications...")

    notifications = [
        {"type": "new_order", "title": "New Order Received", "message": "Mohammed Al Rashid placed order GP-20250001 worth AED 2,450.00", "read": False},
        {"type": "new_order", "title": "New Order Received", "message": "Rashid Enterprises LLC placed a bulk order GP-20250008 worth AED 15,200.00", "read": False},
        {"type": "new_user", "title": "New Customer Registration", "message": "Sara Al Maktoum registered and verified her account", "read": True},
        {"type": "new_enquiry", "title": "New Product Enquiry", "message": "Ahmed Khalil enquired about Jaquar Continental Prime WC - needs 50 units", "read": False},
        {"type": "low_stock", "title": "Low Stock Alert", "message": "Continental Prime Wall Hung WC - only 3 units remaining in stock", "read": False},
        {"type": "new_order", "title": "New Order Received", "message": "Emirates Contracting Co. placed order GP-20250010 worth AED 8,750.00", "read": True},
        {"type": "new_enquiry", "title": "New Cart Enquiry", "message": "Fatima Hassan submitted a cart enquiry for 4 items - requesting quotation", "read": True},
        {"type": "new_user", "title": "New Customer Registration", "message": "Khalid Mohammed registered from Dubai", "read": True},
    ]

    for i, n in enumerate(notifications):
        n["id"] = gen_id()
        n["created_at"] = past_date(i).isoformat()
        await db.notifications.insert_one(n)

    print(f"   ✅ {len(notifications)} notifications created")


async def seed_invoices(products):
    """Create demo invoices."""
    print("🧾 Seeding invoices...")
    invoice_count = 0
    statuses = ["paid", "paid", "pending", "overdue", "paid", "draft"]

    for i in range(6):
        customer = random.choice(DEMO_CUSTOMERS)
        status = statuses[i]
        days_ago = random.randint(1, 45)

        num_items = random.randint(1, 4)
        selected = random.sample(products, min(num_items, len(products))) if products else []

        items = []
        subtotal = 0
        for p in selected:
            qty = random.randint(1, 5)
            price = p.get("offer_price") or p["price"]
            item_total = price * qty
            subtotal += item_total
            items.append({
                "description": p["name"],
                "quantity": qty,
                "unit_price": price,
                "total": item_total,
            })

        vat = round(subtotal * 0.05, 2)
        total = round(subtotal + vat, 2)

        invoice = {
            "id": gen_id(),
            "invoice_number": f"INV-{2025}{str(i+1).zfill(4)}",
            "customer_name": customer["name"],
            "customer_email": customer["email"],
            "customer_phone": customer["phone"],
            "customer_address": random.choice(ADDRESSES)["address_line1"] + ", " + random.choice(ADDRESSES)["emirate"],
            "items": items,
            "subtotal": round(subtotal, 2),
            "vat_amount": vat,
            "total": total,
            "status": status,
            "issue_date": past_date(days_ago).isoformat(),
            "due_date": past_date(max(0, days_ago - 30)).isoformat(),
            "payment_date": past_date(max(0, days_ago - 5)).isoformat() if status == "paid" else None,
            "notes": random.choice(["", "Net 30 payment terms", "Project: Hotel Al Marina", ""]),
            "created_at": past_date(days_ago).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.invoices.insert_one(invoice)
        invoice_count += 1

    print(f"   ✅ {invoice_count} invoices created")


async def main():
    print("\n🚀 Grand Palace Admin — Demo Data Seeder")
    print("=" * 50)

    # Check existing data
    order_count = await db.orders.count_documents({})
    if order_count > 0:
        print(f"\n⚠️  Found {order_count} existing orders.")
        response = input("   Clear existing demo data and reseed? (y/N): ").strip().lower()
        if response != 'y':
            print("   Aborted. No changes made.")
            return
        # Clear demo data
        print("   🧹 Clearing existing data...")
        await db.orders.delete_many({})
        await db.enquiries.delete_many({})
        await db.cart_enquiries.delete_many({})
        await db.notifications.delete_many({})
        await db.invoices.delete_many({})

    products = await get_products()
    if not products:
        print("\n⚠️  No products found in database. Please add products first.")
        print("   Run the product seeder or add products via admin panel.")
        return

    print(f"\n📊 Found {len(products)} products to reference in demo data\n")

    await seed_customers()
    await seed_orders(products)
    await seed_enquiries(products)
    await seed_notifications()
    await seed_invoices(products)

    print("\n" + "=" * 50)
    print("✅ Demo data seeding complete!")
    print("   Refresh the admin panel to see the demo data.")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
