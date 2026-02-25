from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import string
from twilio.rest import Client
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import base64
from io import BytesIO
import random
import stripe
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

# Initialize Firebase Admin
try:
    # Try to load from environment variable path first
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials
        firebase_admin.initialize_app()
except Exception as e:
    print(f"Firebase Admin initialization warning: {e}")
    # Initialize with project ID if possible as a last resort
    project_id = os.getenv("FIREBASE_PROJECT_ID", "gpgt-66169")
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={'projectId': project_id})
    except Exception as e:
        print(f"Firebase Admin fallback failed: {e}")
import httpx
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Twilio Config
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID', '')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"Twilio initialization warning: {e}")
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'gpgt_super_secret_key_2025_uae_secure')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# SendGrid Config
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@gpgt.ae')
ADMIN_EMAIL = 'ajith@lenokinfotech'

# Frontend URL for redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://quote-catalog-1.preview.emergentagent.com')

# Google OAuth Configuration (using Emergent's Google OAuth)
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

app = FastAPI(title="GPGT E-Commerce API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

import erp_routes
import chat_routes
app.include_router(erp_routes.erp_router)
app.include_router(chat_routes.router)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "customer"
    created_at: str

class AddressModel(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    emirate: str
    postal_code: Optional[str] = None
    country: str = "UAE"

class ProductCreate(BaseModel):
    name: str
    name_ar: Optional[str] = None
    description: str
    description_ar: Optional[str] = None
    price: float
    offer_price: Optional[float] = None
    category_id: str
    sku: str
    stock: int = 0
    images: List[str] = []
    brand: Optional[str] = None
    specifications: Optional[Dict[str, str]] = {}
    highlights: Optional[List[str]] = []
    box_contents: Optional[List[str]] = []
    faqs: Optional[List[Dict[str, str]]] = []
    is_active: bool = True
    is_featured: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    description: Optional[str] = None
    description_ar: Optional[str] = None
    price: Optional[float] = None
    offer_price: Optional[float] = None
    category_id: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    brand: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None
    highlights: Optional[List[str]] = None
    box_contents: Optional[List[str]] = None
    faqs: Optional[List[Dict[str, str]]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

class CategoryCreate(BaseModel):
    name: str
    name_ar: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: bool = True
    subcategories: Optional[List[str]] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: AddressModel
    billing_address: Optional[AddressModel] = None
    payment_method: str = "card"  # card, cod
    notes: Optional[str] = None

class SettingsUpdate(BaseModel):
    payment_enabled: Optional[bool] = None
    cod_enabled: Optional[bool] = None
    vat_percentage: Optional[float] = None
    flat_shipping_rate: Optional[float] = None
    free_shipping_threshold: Optional[float] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_trn: Optional[str] = None
    whatsapp_number: Optional[str] = None
    delivery_emirates: Optional[List[str]] = None
    admin_notification_email: Optional[str] = None
    # Firebase Email Settings
    firebase_enabled: Optional[bool] = None
    firebase_api_key: Optional[str] = None
    firebase_project_id: Optional[str] = None
    firebase_auth_domain: Optional[str] = None
    # Hero Slides
    hero_slides: Optional[List[Dict[str, str]]] = None

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

# ==================== OTP MODELS ====================

class OTPVerifyRequest(BaseModel):
    otp: str

class ResendOTPRequest(BaseModel):
    type: str = "email"  # email or phone (future)

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str = "customer") -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    return user

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await require_auth(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== OTP HELPER FUNCTIONS ====================

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

async def send_otp_email(email: str, otp: str, user_name: str = "User"):
    """Send OTP verification email using SendGrid or Firebase"""
    settings = await get_settings()
    
    # Check if Firebase is enabled and configured
    firebase_enabled = settings.get("firebase_enabled", False)
    firebase_api_key = settings.get("firebase_api_key", "")
    
    if firebase_enabled and firebase_api_key:
        # Use Firebase for sending email (via Firebase REST API)
        try:
            import requests
            # Firebase doesn't directly send custom emails, so we'll use a workaround
            # In production, you'd use Firebase Functions or a custom SMTP setup
            # For now, we'll fall back to SendGrid if Firebase email isn't fully configured
            logger.info("Firebase email sending - falling back to SendGrid for OTP")
        except Exception as e:
            logger.error(f"Firebase email error: {e}")
    
    # Default: Use SendGrid
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping OTP email")
        return False
    
    try:
        company_name = settings.get("company_name", "Grand Palace General Trading")
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #d4af37; margin: 0; font-size: 28px;">{company_name}</h1>
                <p style="color: #ffffff; margin: 10px 0 0;">Email Verification</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #1e3a5f; margin-top: 0;">Hello {user_name},</h2>
                <p style="color: #555; line-height: 1.6;">Thank you for registering with us. Please use the following OTP to verify your email address:</p>
                
                <div style="background: linear-gradient(135deg, #d4af37 0%, #f0d78c 100%); padding: 20px; text-align: center; border-radius: 10px; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: #1e3a5f; letter-spacing: 8px;">{otp}</span>
                </div>
                
                <p style="color: #888; font-size: 14px; text-align: center;">This OTP is valid for <strong>5 minutes</strong>.</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <p style="color: #856404; margin: 0; font-size: 13px;">
                        <strong>Security Tip:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
                    </p>
                </div>
            </div>
            <div style="background: #1e3a5f; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="color: #ffffff; margin: 0; font-size: 12px;">If you didn't request this verification, please ignore this email.</p>
                <p style="color: #d4af37; margin: 10px 0 0; font-size: 12px;">{company_name} - Your Trusted Partner</p>
            </div>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=email,
            subject=f"Email Verification OTP - {company_name}",
            html_content=html_content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        logger.info(f"OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        return False


async def send_twilio_otp(phone: str):
    """Send OTP using Twilio Verify Service"""
    if not twilio_client or not TWILIO_VERIFY_SERVICE_SID:
        logger.warning("Twilio not configured, skipping SMS OTP")
        return False
    
    try:
        verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verifications \
            .create(to=phone, channel='sms')
        logger.info(f"Twilio OTP sent to {phone}: {verification.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Twilio OTP: {e}")
        return False

async def verify_twilio_otp(phone: str, code: str):
    """Verify OTP using Twilio Verify Service"""
    if not twilio_client or not TWILIO_VERIFY_SERVICE_SID:
        logger.warning("Twilio not configured, cannot verify OTP")
        return False
    
    try:
        verification_check = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
            .verification_checks \
            .create(to=phone, code=code)
        return verification_check.status == 'approved'
    except Exception as e:
        logger.error(f"Failed to verify Twilio OTP: {e}")
        return False

OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 3
OTP_RESEND_COOLDOWN_SECONDS = 30
OTP_LOCK_MINUTES = 15

async def get_settings():
    default_settings = {
        "id": "global",
        "payment_enabled": True,
        "cod_enabled": True,
        "vat_percentage": 5.0,
        "flat_shipping_rate": 25.0,
        "free_shipping_threshold": 500.0,
        "company_name": "Grand Palace General Trading",
        "company_address": "Dubai, UAE",
        "company_phone": "+971 4 456 7890",
        "company_email": "info@gpgt.ae",
        "company_trn": "TRN123456789",
        "whatsapp_number": "+971 4 456 7890",
        "delivery_emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
        "admin_notification_email": "ajith@lenokinfotech",
        # Firebase settings
        "firebase_enabled": False,
        "firebase_api_key": "",
        "firebase_project_id": "",
        "firebase_auth_domain": "",
        # Quotation mode - hide prices when False
        "show_prices": True,
        # Hero slides for homepage banner
        "hero_slides": [
            {"image": "https://images.unsplash.com/photo-1707064892275-a3088e8240be?w=1200", "title": "Quality Building Materials", "title_ar": "مواد بناء عالية الجودة", "subtitle": "Your Trusted Partner in Construction & Trading"},
            {"image": "https://images.unsplash.com/photo-1745449563046-f75d0bd28f46?w=1200", "title": "Industrial Tools & Equipment", "title_ar": "أدوات ومعدات صناعية", "subtitle": "Professional Grade Tools for Every Project"},
            {"image": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200", "title": "Safety & Security Solutions", "title_ar": "حلول السلامة والأمان", "subtitle": "Protect What Matters Most"}
        ]
    }
    
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        await db.settings.insert_one(default_settings)
        return default_settings
    
    # Merge default settings with existing settings (add missing fields)
    merged_settings = {**default_settings, **settings}
    return merged_settings

def generate_order_number():
    return f"GPGT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

def generate_invoice_number():
    return f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4].upper()}"

# ==================== NOTIFICATION HELPERS ====================

async def create_notification(notification_type: str, title: str, message: str, data: dict = None):
    """Create a new notification for admins"""
    notification = {
        "id": str(uuid.uuid4()),
        "type": notification_type,  # 'new_user', 'new_order', 'new_enquiry', 'low_stock', etc.
        "title": title,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

async def send_order_email(order: dict, to_admin: bool = False):
    """Send order notification email"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email")
        return False
    
    settings = await get_settings()
    
    # Use admin_notification_email if sending to admin, otherwise customer email
    if to_admin:
        recipient = settings.get("admin_notification_email") or ADMIN_EMAIL
    else:
        recipient = order.get("customer_email")
    
    if not recipient:
        return False
    
    # Check if payment is disabled - add notice to admin emails
    payment_disabled_notice = ""
    if to_admin and not settings.get("payment_enabled", True):
        payment_disabled_notice = """
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <strong style="color: #856404;">Payment Gateway Disabled</strong>
            <p style="color: #856404; margin: 5px 0 0;">This order requires manual payment processing. Please contact the customer to arrange payment.</p>
        </div>
        """
    
    subject = f"New Order #{order['order_number']} - Action Required" if to_admin and not settings.get("payment_enabled", True) else (
        f"New Order #{order['order_number']}" if to_admin else f"Order Confirmation - #{order['order_number']}"
    )
    
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item['product_name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item['quantity']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">AED {item['unit_price']:.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">AED {item['total_price']:.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 20px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0;">Grand Palace General Trading</h1>
            <p style="color: #fff; margin: 5px 0;">Quality Building Materials</p>
        </div>
        
        <div style="padding: 20px;">
            {payment_disabled_notice}
            <h2 style="color: #1e3a5f;">Order #{order['order_number']}</h2>
            <p><strong>Date:</strong> {order.get('created_at', '')}</p>
            <p><strong>Status:</strong> {order.get('status', 'pending').upper()}</p>
            <p><strong>Payment Method:</strong> {order.get('payment_method', 'card').upper()}</p>
            
            <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <div style="margin-top: 20px; text-align: right;">
                <p><strong>Subtotal:</strong> AED {order.get('subtotal', 0):.2f}</p>
                <p><strong>VAT (5%):</strong> AED {order.get('vat_amount', 0):.2f}</p>
                <p><strong>Shipping:</strong> AED {order.get('shipping_cost', 0):.2f}</p>
                <p style="font-size: 18px; color: #d4af37;"><strong>Total:</strong> AED {order.get('total', 0):.2f}</p>
            </div>
            
            <h3 style="color: #0a1628; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Shipping Address</h3>
            <p>
                {order.get('shipping_address', {}).get('full_name', '')}<br>
                {order.get('shipping_address', {}).get('address_line1', '')}<br>
                {order.get('shipping_address', {}).get('city', '')}, {order.get('shipping_address', {}).get('emirate', '')}<br>
                {order.get('shipping_address', {}).get('phone', '')}
            </p>
        </div>
        
        <div style="background: #0a1628; padding: 20px; text-align: center; color: #fff;">
            <p style="margin: 0;">Thank you for your order!</p>
            <p style="margin: 5px 0; color: #d4af37;">{settings.get('company_phone', '')}</p>
        </div>
    </body>
    </html>
    """
    
    try:
        message = Mail(from_email=SENDER_EMAIL, to_emails=recipient, subject=subject, html_content=html_content)
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False

async def generate_invoice_pdf(order: dict) -> bytes:
    """Generate PDF invoice for an order"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    settings = await get_settings()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#0a1628'), alignment=TA_CENTER)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#666666'), alignment=TA_CENTER)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#d4af37'), spaceAfter=10)
    
    # Header
    elements.append(Paragraph(settings.get('company_name', 'Grand Palace General Trading'), title_style))
    elements.append(Paragraph(f"{settings.get('company_address', '')} | {settings.get('company_phone', '')} | TRN: {settings.get('company_trn', '')}", header_style))
    elements.append(Spacer(1, 20))
    
    # Invoice details
    elements.append(Paragraph("TAX INVOICE", section_style))
    invoice_data = [
        ["Invoice Number:", order.get('invoice_number', ''), "Date:", order.get('created_at', '')[:10]],
        ["Order Number:", order.get('order_number', ''), "Status:", order.get('status', '').upper()],
    ]
    invoice_table = Table(invoice_data, colWidths=[100, 150, 80, 150])
    invoice_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 20))
    
    # Customer details
    elements.append(Paragraph("Bill To:", section_style))
    shipping = order.get('shipping_address', {})
    customer_info = f"{shipping.get('full_name', '')}<br/>{shipping.get('address_line1', '')}<br/>{shipping.get('city', '')}, {shipping.get('emirate', '')}<br/>Phone: {shipping.get('phone', '')}"
    elements.append(Paragraph(customer_info, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Items table
    elements.append(Paragraph("Order Items:", section_style))
    items_data = [["#", "Product", "Qty", "Unit Price", "Total"]]
    for idx, item in enumerate(order.get('items', []), 1):
        items_data.append([
            str(idx),
            item.get('product_name', ''),
            str(item.get('quantity', 0)),
            f"AED {item.get('unit_price', 0):.2f}",
            f"AED {item.get('total_price', 0):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[30, 230, 50, 80, 80])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a1628')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Totals
    totals_data = [
        ["Subtotal:", f"AED {order.get('subtotal', 0):.2f}"],
        [f"VAT ({settings.get('vat_percentage', 5)}%):", f"AED {order.get('vat_amount', 0):.2f}"],
        ["Shipping:", f"AED {order.get('shipping_cost', 0):.2f}"],
        ["TOTAL:", f"AED {order.get('total', 0):.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=[380, 100])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#d4af37')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#d4af37')),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#888888'), alignment=TA_CENTER)
    elements.append(Paragraph("Thank you for your business!", footer_style))
    elements.append(Paragraph(f"{settings.get('company_name', '')} - Your Trusted Partner in Construction & Trading", footer_style))
    
    doc.build(elements)
    return buffer.getvalue()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if phone exists (if provided)
    if user.phone:
        existing_phone = await db.users.find_one({"phone": user.phone})
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user_id = str(uuid.uuid4())
    
    # Generate email OTP
    email_otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "role": "customer",
        "addresses": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        # Email verification fields
        "email_verified": False,
        "email_otp": email_otp,
        "email_otp_expiry": otp_expiry.isoformat(),
        "email_otp_attempts": 0,
        "email_otp_locked_until": None,
        "last_email_otp_sent_at": datetime.now(timezone.utc).isoformat(),
        # Phone verification fields (for future)
        "phone_verified": False,
        "phone_otp": None,
        "phone_otp_expiry": None,
        "phone_otp_attempts": 0,
        "phone_otp_locked_until": None,
        "last_phone_otp_sent_at": None
    }
    await db.users.insert_one(user_doc)
    
    # Create notification for new user registration
    await create_notification(
        notification_type="new_user",
        title="New User Registration",
        message=f"{user.name} ({user.email}) has registered",
        data={"user_id": user_id, "email": user.email, "name": user.name}
    )
    
    # Send OTP email in background
    background_tasks.add_task(send_otp_email, user.email, email_otp, user.name)
    
    token = create_token(user_id)
    # Return user without sensitive OTP data
    safe_user = {k: v for k, v in user_doc.items() if k not in ["password", "_id", "email_otp", "phone_otp"]}
    return {
        "token": token, 
        "user": safe_user,
        "requires_verification": True,
        "message": "Registration successful! Please verify your email."
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user.get("role", "customer"))
    # Return user without sensitive OTP data
    safe_user = {k: v for k, v in user.items() if k not in ["password", "_id", "email_otp", "phone_otp"]}
    return {"token": token, "user": safe_user}

@api_router.post("/auth/firebase/verify-phone")
async def verify_phone(data: dict):
    id_token = data.get("idToken")
    if not id_token:
        raise HTTPException(status_code=400, detail="ID Token is required")
    
    try:
        # Verify the ID token sent by the client
        decoded_token = firebase_auth.verify_id_token(id_token)
        phone_number = decoded_token.get("phone_number")
        
        if not phone_number:
            raise HTTPException(status_code=400, detail="Phone number not found in token")
        
        # Check if user exists with this phone number
        user = await db.users.find_one({"phone": phone_number})
        
        if not user:
            # Create new user for this phone number
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "email": f"phone_{user_id}@example.com",
                "phone": phone_number,
                "name": f"User {phone_number[-4:]}",
                "role": "customer",
                "phone_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            user = user_doc
        else:
            # Update verification status if needed
            if not user.get("phone_verified"):
                await db.users.update_one({"id": user["id"]}, {"$set": {"phone_verified": True}})
                user["phone_verified"] = True
        
        token = create_token(user["id"], user.get("role", "customer"))
        safe_user = {k: v for k, v in user.items() if k not in ["password", "_id", "email_otp", "phone_otp"]}
        
        return {"token": token, "user": safe_user}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase verification failed: {str(e)}")

@api_router.post("/auth/firebase/verify-phone")
async def verify_phone(data: dict):
    id_token = data.get("idToken")
    if not id_token:
        raise HTTPException(status_code=400, detail="ID Token is required")
    
    try:
        # Verify the ID token sent by the client
        decoded_token = firebase_auth.verify_id_token(id_token)
        phone_number = decoded_token.get("phone_number")
        
        if not phone_number:
            raise HTTPException(status_code=400, detail="Phone number not found in token")
        
        # Check if user exists with this phone number
        user = await db.users.find_one({"phone": phone_number})
        
        if not user:
            # Create new user for this phone number
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "email": f"phone_{user_id}@example.com", # Placeholder email
                "phone": phone_number,
                "name": f"User {phone_number[-4:]}",
                "role": "customer",
                "phone_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            user = user_doc
        else:
            # Update verification status if needed
            if not user.get("phone_verified"):
                await db.users.update_one({"id": user["id"]}, {"$set": {"phone_verified": True}})
                user["phone_verified"] = True
        
        token = create_token(user["id"], user.get("role", "customer"))
        safe_user = {k: v for k, v in user.items() if k not in ["password", "_id", "email_otp", "phone_otp"]}
        
        return {"token": token, "user": safe_user}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase verification failed: {str(e)}")

# ==================== GOOGLE OAUTH ROUTES ====================

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# ==================== EMERGENT MANAGED GOOGLE OAUTH ====================
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

@api_router.post("/auth/emergent/session")
async def emergent_auth_session(request: Request):
    """
    Exchange Emergent OAuth session_id for user data and create/login user.
    Frontend calls this after returning from auth.emergentagent.com with session_id in URL fragment.
    """
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        # Call Emergent Auth to get session data
        async with httpx.AsyncClient() as client:
            response = await client.get(
                EMERGENT_AUTH_SESSION_URL,
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Emergent auth session fetch failed: {response.text}")
                raise HTTPException(status_code=401, detail="Invalid or expired session")
            
            session_data = response.json()
        
        email = session_data.get("email")
        name = session_data.get("name", email.split("@")[0] if email else "User")
        picture = session_data.get("picture", "")
        emergent_session_token = session_data.get("session_token")
        google_id = session_data.get("id", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="No email returned from OAuth")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            # Update Google info if needed
            update_data = {
                "profile_picture": picture,
                "email_verified": True,
                "last_login": datetime.now(timezone.utc).isoformat()
            }
            if not existing_user.get("google_id"):
                update_data["google_id"] = google_id
                update_data["auth_provider"] = "google"
            
            await db.users.update_one({"id": existing_user["id"]}, {"$set": update_data})
            
            # Create notification for returning user (optional)
            # await create_notification("user_login", "User Login", f"{name} logged in via Google", {"user_id": existing_user["id"]})
            
            token = create_token(existing_user["id"], existing_user.get("role", "customer"))
            user_data = {k: v for k, v in existing_user.items() if k not in ["password", "email_otp", "phone_otp"]}
            user_data["profile_picture"] = picture
            
            return {"token": token, "user": user_data}
        
        # Create new user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email,
            "password": None,
            "name": name,
            "phone": None,
            "role": "customer",
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "email_verified": True,
            "phone_verified": False,
            "google_id": google_id,
            "profile_picture": picture,
            "auth_provider": "google",
            "is_active": True
        }
        await db.users.insert_one(user_doc)
        
        # Create notification for new user registration via Google
        await create_notification(
            notification_type="new_user",
            title="New Google User",
            message=f"{name} ({email}) registered via Google",
            data={"user_id": user_id, "email": email, "name": name, "auth_provider": "google"}
        )
        
        token = create_token(user_id)
        safe_user = {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}
        
        return {"token": token, "user": safe_user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergent auth session error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment.")
    
    # Get the base URL from the request
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}/api/auth/google/callback"
    
    # Build Google OAuth URL
    scope = "openid email profile"
    auth_url = f"{GOOGLE_AUTH_URL}?client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&access_type=offline"
    
    return {"auth_url": auth_url}

@api_router.get("/auth/google/callback")
async def google_callback(request: Request, code: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        logger.error(f"Google OAuth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
    
    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_code")
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_not_configured")
    
    try:
        # Get the base URL from the request
        base_url = str(request.base_url).rstrip('/')
        redirect_uri = f"{base_url}/api/auth/google/callback"
        
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            })
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            userinfo_response = await client.get(GOOGLE_USERINFO_URL, headers={
                "Authorization": f"Bearer {access_token}"
            })
            
            if userinfo_response.status_code != 200:
                logger.error(f"Userinfo fetch failed: {userinfo_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo_failed")
            
            google_user = userinfo_response.json()
        
        email = google_user.get("email")
        name = google_user.get("name", email.split("@")[0] if email else "User")
        picture = google_user.get("picture", "")
        google_id = google_user.get("id", "")
        
        if not email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # Update Google info if needed
            if not existing_user.get("google_id"):
                await db.users.update_one(
                    {"id": existing_user["id"]},
                    {"$set": {
                        "google_id": google_id,
                        "profile_picture": picture,
                        "email_verified": True,
                        "auth_provider": "google"
                    }}
                )
            
            token = create_token(existing_user["id"], existing_user.get("role", "customer"))
            return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={token}")
        
        # Create new user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email,
            "password": None,
            "name": name,
            "phone": "",
            "role": "customer",
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "email_verified": True,
            "phone_verified": False,
            "google_id": google_id,
            "profile_picture": picture,
            "auth_provider": "google",
            "is_active": True
        }
        await db.users.insert_one(user_doc)
        
        token = create_token(user_id)
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={token}")
        
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(require_auth)):
    # Remove sensitive OTP data
    return {k: v for k, v in user.items() if k not in ["email_otp", "phone_otp"]}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@api_router.put("/users/profile")
async def update_profile(profile: ProfileUpdate, user: dict = Depends(require_auth)):
    """Update user profile"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile updated successfully"}

class AddressUpdate(BaseModel):
    addresses: List[Dict[str, Any]]

@api_router.put("/users/addresses")
async def update_addresses(address_data: AddressUpdate, user: dict = Depends(require_auth)):
    """Update user addresses"""
    result = await db.users.update_one(
        {"id": user["id"]}, 
        {"$set": {"addresses": address_data.addresses, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Addresses updated successfully"}

# ==================== OTP VERIFICATION ROUTES ====================

@api_router.post("/auth/verify-email")
async def verify_email_otp(request: OTPVerifyRequest, user: dict = Depends(require_auth)):
    """Verify email OTP"""
    # Get fresh user data from DB
    db_user = await db.users.find_one({"id": user["id"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already verified
    if db_user.get("email_verified"):
        return {"message": "Email already verified", "email_verified": True}
    
    # Check if locked
    locked_until = db_user.get("email_otp_locked_until")
    if locked_until:
        locked_time = datetime.fromisoformat(locked_until.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) < locked_time:
            remaining = int((locked_time - datetime.now(timezone.utc)).total_seconds() / 60)
            raise HTTPException(status_code=429, detail=f"Too many attempts. Please try again in {remaining} minutes.")
    
    # Check OTP expiry
    otp_expiry = db_user.get("email_otp_expiry")
    if otp_expiry:
        expiry_time = datetime.fromisoformat(otp_expiry.replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expiry_time:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Check attempts
    attempts = db_user.get("email_otp_attempts", 0)
    if attempts >= OTP_MAX_ATTEMPTS:
        # Lock the account
        lock_until = datetime.now(timezone.utc) + timedelta(minutes=OTP_LOCK_MINUTES)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"email_otp_locked_until": lock_until.isoformat()}}
        )
        raise HTTPException(status_code=429, detail=f"Too many failed attempts. Account locked for {OTP_LOCK_MINUTES} minutes.")
    
    # Verify OTP
    if request.otp != db_user.get("email_otp"):
        # Increment attempts
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"email_otp_attempts": 1}}
        )
        remaining_attempts = OTP_MAX_ATTEMPTS - attempts - 1
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {remaining_attempts} attempts remaining.")
    
    # Success - update user
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "email_verified": True,
            "email_otp": None,
            "email_otp_expiry": None,
            "email_otp_attempts": 0,
            "email_otp_locked_until": None
        }}
    )
    
    return {"message": "Email verified successfully!", "email_verified": True}

@api_router.post("/auth/resend-email-otp")
async def resend_email_otp(user: dict = Depends(require_auth), background_tasks: BackgroundTasks = None):
    """Resend email verification OTP"""
    # Get fresh user data from DB
    db_user = await db.users.find_one({"id": user["id"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already verified
    if db_user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Check cooldown
    last_sent = db_user.get("last_email_otp_sent_at")
    if last_sent:
        last_sent_time = datetime.fromisoformat(last_sent.replace('Z', '+00:00'))
        cooldown_end = last_sent_time + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if datetime.now(timezone.utc) < cooldown_end:
            remaining = int((cooldown_end - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(status_code=429, detail=f"Please wait {remaining} seconds before requesting a new OTP.")
    
    # Generate new OTP
    new_otp = generate_otp()
    new_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    # Update user
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "email_otp": new_otp,
            "email_otp_expiry": new_expiry.isoformat(),
            "email_otp_attempts": 0,
            "email_otp_locked_until": None,
            "last_email_otp_sent_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send OTP email
    if background_tasks:
        background_tasks.add_task(send_otp_email, db_user["email"], new_otp, db_user.get("name", "User"))
    else:
        await send_otp_email(db_user["email"], new_otp, db_user.get("name", "User"))
    
    return {"message": "OTP sent successfully! Please check your email."}

@api_router.get("/auth/verification-status")
async def get_verification_status(user: dict = Depends(require_auth)):
    """Get user's verification status"""
    db_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0, "email_otp": 0, "phone_otp": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email_verified": db_user.get("email_verified", False),
        "phone_verified": db_user.get("phone_verified", False),
        "can_checkout": db_user.get("email_verified", False)  # Email must be verified to checkout
    }

@api_router.post("/auth/admin/create")
async def create_admin(user: UserCreate, admin: dict = Depends(require_admin)):
    """Create admin user (super admin only)"""
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return {"message": "Admin created", "user_id": user_id}

# ==================== FILE UPLOAD ROUTES ====================

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload/image")
async def upload_image(request: Request, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    """Upload an image file and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Return absolute URL
    base_url = str(request.base_url).rstrip("/")
    image_url = f"{base_url}/api/uploads/{filename}"
    return {"url": image_url, "filename": filename}

@api_router.post("/upload/images")
async def upload_multiple_images(request: Request, files: List[UploadFile] = File(...), admin: dict = Depends(require_admin)):
    """Upload multiple image files"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per upload")
    
    urls = []
    for file in files:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
            continue
        
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            continue
        
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = UPLOAD_DIR / filename
        
        with open(filepath, "wb") as f:
            f.write(contents)
        
        base_url = str(request.base_url).rstrip("/")
        urls.append(f"{base_url}/api/uploads/{filename}")
    
    return {"urls": urls, "count": len(urls)}

# Serve uploaded files
from fastapi.responses import FileResponse

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories")
async def get_categories():
    all_cats = await db.categories.find({"is_active": True}, {"_id": 0}).to_list(200)
    # Build hierarchical structure: main categories with children
    main_cats = [c for c in all_cats if not c.get("parent_id")]
    sub_cats = [c for c in all_cats if c.get("parent_id")]
    
    # Group subcategories by parent_id
    children_map = {}
    for sc in sub_cats:
        pid = sc["parent_id"]
        children_map.setdefault(pid, []).append(sc)
    
    # Attach children to main categories
    for mc in main_cats:
        mc["children"] = children_map.get(mc["id"], [])
        # Update product count to include subcategory product counts
        child_product_count = sum(c.get("product_count", 0) for c in mc["children"])
        mc["total_product_count"] = mc.get("product_count", 0) + child_product_count
    
    return main_cats

@api_router.get("/categories/all")
async def get_all_categories(admin: dict = Depends(require_admin)):
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.get("/categories/{category_id}")
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.post("/categories")
async def create_category(category: CategoryCreate, admin: dict = Depends(require_admin)):
    category_id = str(uuid.uuid4())
    category_doc = {
        "id": category_id,
        **category.model_dump(),
        "product_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category_doc)
    return {"id": category_id, "message": "Category created"}

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate, admin: dict = Depends(require_admin)):
    result = await db.categories.update_one({"id": category_id}, {"$set": category.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(require_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    featured: Optional[bool] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    limit: int = 20
):
    query = {"is_active": True}
    
    if category_id:
        # Check if this is a parent category - if so, include all child categories
        category = await db.categories.find_one({"id": category_id}, {"_id": 0})
        if category and not category.get("parent_id"):
            # It's a main category - find all child category IDs
            child_cats = await db.categories.find(
                {"parent_id": category_id, "is_active": True}, 
                {"id": 1, "_id": 0}
            ).to_list(100)
            child_ids = [c["id"] for c in child_cats]
            # Include products from parent and all children
            query["category_id"] = {"$in": [category_id] + child_ids}
        else:
            query["category_id"] = category_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if brand:
        query["brand"] = brand
    if featured:
        query["is_featured"] = True
    
    sort_dir = -1 if sort_order == "desc" else 1
    skip = (page - 1) * limit
    
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/products/all")
async def get_all_products(admin: dict = Depends(require_admin), page: int = 1, limit: int = 50):
    skip = (page - 1) * limit
    total = await db.products.count_documents({})
    products = await db.products.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit}

# ==================== TWILIO OTP ENDPOINTS ====================

@app.post("/api/auth/send-otp")
async def send_otp(request: Request):
    data = await request.json()
    phone = data.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    
    # Sanitize phone number (remove spaces, etc.)
    sanitized_phone = "+" + "".join(filter(str.isdigit, phone)) if phone.startswith("+") else "+" + "".join(filter(str.isdigit, phone))
    
    success = await send_twilio_otp(sanitized_phone)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    
    return {"message": "OTP sent successfully"}

@app.post("/api/auth/verify-otp")
async def verify_otp(request: Request):
    data = await request.json()
    phone = data.get("phone")
    code = data.get("otp")
    
    if not phone or not code:
        raise HTTPException(status_code=400, detail="Phone and OTP are required")
    
    # Sanitize phone number
    sanitized_phone = "+" + "".join(filter(str.isdigit, phone)) if phone.startswith("+") else "+" + "".join(filter(str.isdigit, phone))
    
    is_valid = await verify_twilio_otp(sanitized_phone, code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # User logic: find or create user with this phone number
    user = await db.users.find_one({"phone": phone})
    if not user:
        # Create new user if doesn't exist (Phone-only login)
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "phone": phone,
            "name": f"User {phone[-4:]}",
            "role": "customer",
            "email": f"{phone[1:]}@phone.user", # Placeholder email
            "phone_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        # Update verification status
        await db.users.update_one({"id": user["id"]}, {"$set": {"phone_verified": True}})
    
    token = create_token(user["id"], user.get("role", "customer"))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "name": user["name"],
            "role": user.get("role", "customer")
        }
    }

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products")
async def create_product(product: ProductCreate, admin: dict = Depends(require_admin)):
    # Check SKU uniqueness
    existing = await db.products.find_one({"sku": product.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    
    # Update category product count
    await db.categories.update_one({"id": product.category_id}, {"$inc": {"product_count": 1}})
    
    return {"id": product_id, "message": "Product created"}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.delete_one({"id": product_id})
    await db.categories.update_one({"id": product["category_id"]}, {"$inc": {"product_count": -1}})
    
    return {"message": "Product deleted"}

# ==================== PRODUCT REVIEWS & RATINGS ====================

class ReviewCreate(BaseModel):
    rating: int  # 1-5 stars
    title: Optional[str] = None
    comment: str
    
class ReviewResponse(BaseModel):
    helpful: bool = True

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review: ReviewCreate, user: dict = Depends(require_auth)):
    """Add a review for a product (authenticated users only)"""
    # Validate product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if user already reviewed this product
    existing_review = await db.reviews.find_one({
        "product_id": product_id,
        "user_id": user["id"]
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    # Create review
    review_doc = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Anonymous"),
        "user_email": user.get("email", ""),
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "helpful_count": 0,
        "verified_purchase": False,  # Can be set to True if user purchased this product
        "status": "published",  # published, pending, rejected
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if user has purchased this product
    order_with_product = await db.orders.find_one({
        "user_id": user["id"],
        "items.product_id": product_id,
        "status": {"$in": ["delivered", "completed"]}
    })
    if order_with_product:
        review_doc["verified_purchase"] = True
    
    await db.reviews.insert_one(review_doc)
    
    # Update product average rating
    await update_product_rating(product_id)
    
    return {"message": "Review submitted successfully", "review_id": review_doc["id"]}

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(
    product_id: str, 
    page: int = 1, 
    limit: int = 10,
    sort_by: str = "created_at"  # created_at, rating, helpful_count
):
    """Get reviews for a product"""
    # Validate product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    skip = (page - 1) * limit
    
    # Only show published reviews
    query = {"product_id": product_id, "status": "published"}
    
    # Sort direction
    sort_dir = -1  # Newest first by default
    if sort_by == "rating":
        sort_dir = -1  # Highest rating first
    
    total = await db.reviews.count_documents(query)
    reviews = await db.reviews.find(query, {"_id": 0, "user_email": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    # Calculate rating breakdown
    rating_breakdown = {}
    for i in range(1, 6):
        rating_breakdown[str(i)] = await db.reviews.count_documents({"product_id": product_id, "status": "published", "rating": i})
    
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
        "rating_breakdown": rating_breakdown,
        "average_rating": product.get("average_rating", 0),
        "review_count": product.get("review_count", 0)
    }

@api_router.put("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str, response: ReviewResponse):
    """Mark a review as helpful or not"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if response.helpful:
        await db.reviews.update_one({"id": review_id}, {"$inc": {"helpful_count": 1}})
    
    return {"message": "Feedback recorded"}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin: dict = Depends(require_admin)):
    """Delete a review (admin only)"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    product_id = review["product_id"]
    await db.reviews.delete_one({"id": review_id})
    
    # Update product rating
    await update_product_rating(product_id)
    
    return {"message": "Review deleted"}

async def update_product_rating(product_id: str):
    """Recalculate and update product average rating"""
    pipeline = [
        {"$match": {"product_id": product_id, "status": "published"}},
        {"$group": {
            "_id": None,
            "average_rating": {"$avg": "$rating"},
            "review_count": {"$sum": 1}
        }}
    ]
    
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "average_rating": round(result[0]["average_rating"], 1),
                "review_count": result[0]["review_count"]
            }}
        )
    else:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"average_rating": 0, "review_count": 0}}
        )

# ==================== PRODUCT ENQUIRY ====================

class ProductEnquiry(BaseModel):
    product_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    message: Optional[str] = None
    quantity: int = 1

@api_router.post("/enquiry")
async def submit_product_enquiry(enquiry: ProductEnquiry):
    """Submit a product enquiry when payment is disabled"""
    product = await db.products.find_one({"id": enquiry.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    settings = await get_settings()
    
    # Create enquiry record
    enquiry_doc = {
        "id": str(uuid.uuid4()),
        "product_id": enquiry.product_id,
        "product_name": product.get("name"),
        "product_sku": product.get("sku"),
        "product_price": product.get("offer_price") or product.get("price"),
        "quantity": enquiry.quantity,
        "customer_name": enquiry.customer_name,
        "customer_email": enquiry.customer_email,
        "customer_phone": enquiry.customer_phone,
        "message": enquiry.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enquiries.insert_one(enquiry_doc)
    
    # Send email to admin
    admin_email = settings.get("admin_notification_email") or ADMIN_EMAIL
    if SENDGRID_API_KEY and admin_email:
        try:
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 20px; text-align: center;">
                    <h1 style="color: #d4af37; margin: 0;">New Product Enquiry</h1>
                </div>
                <div style="padding: 20px;">
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                        <strong style="color: #856404;">Action Required</strong>
                        <p style="color: #856404; margin: 5px 0 0;">A customer has submitted an enquiry for a product. Please contact them to complete the order.</p>
                    </div>
                    
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Product Details</h3>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr><td><strong>Product:</strong></td><td>{product.get('name')}</td></tr>
                        <tr><td><strong>SKU:</strong></td><td>{product.get('sku')}</td></tr>
                        <tr><td><strong>Price:</strong></td><td>AED {product.get('offer_price') or product.get('price')}</td></tr>
                        <tr><td><strong>Quantity:</strong></td><td>{enquiry.quantity}</td></tr>
                    </table>
                    
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Customer Details</h3>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr><td><strong>Name:</strong></td><td>{enquiry.customer_name}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>{enquiry.customer_email}</td></tr>
                        <tr><td><strong>Phone:</strong></td><td>{enquiry.customer_phone}</td></tr>
                        <tr><td><strong>Message:</strong></td><td>{enquiry.message or 'No message'}</td></tr>
                    </table>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=FROM_EMAIL,
                to_emails=admin_email,
                subject=f"Product Enquiry: {product.get('name')} - {enquiry.customer_name}",
                html_content=html_content
            )
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            sg.send(message)
        except Exception as e:
            logger.error(f"Failed to send enquiry email: {e}")
    
    return {"message": "Enquiry submitted successfully", "enquiry_id": enquiry_doc["id"]}

@api_router.get("/enquiries")
async def get_enquiries(admin: dict = Depends(require_admin), status: Optional[str] = None):
    """Get all product enquiries (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    enquiries = await db.enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"enquiries": enquiries}

@api_router.put("/enquiries/{enquiry_id}")
async def update_enquiry_status(enquiry_id: str, status: str, admin: dict = Depends(require_admin)):
    """Update enquiry status"""
    result = await db.enquiries.update_one({"id": enquiry_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"message": "Enquiry updated"}

# ==================== CONTACT FORM ENQUIRY ====================

class ContactEnquiry(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str

@api_router.post("/enquiry/contact")
async def submit_contact_enquiry(enquiry: ContactEnquiry):
    """Submit a general contact form enquiry"""
    settings = await get_settings()
    
    enquiry_doc = {
        "id": str(uuid.uuid4()),
        "type": "contact",
        "customer_name": enquiry.name,
        "customer_email": enquiry.email,
        "customer_phone": enquiry.phone,
        "subject": enquiry.subject,
        "message": enquiry.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.enquiries.insert_one(enquiry_doc)
    
    # Send email to admin
    admin_email = settings.get("admin_notification_email") or ADMIN_EMAIL
    if SENDGRID_API_KEY and admin_email:
        try:
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 20px; text-align: center;">
                    <h1 style="color: #d4af37; margin: 0;">New Contact Form Submission</h1>
                </div>
                <div style="padding: 20px;">
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Message Details</h3>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr><td><strong>Name:</strong></td><td>{enquiry.name}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>{enquiry.email}</td></tr>
                        <tr><td><strong>Phone:</strong></td><td>{enquiry.phone or 'N/A'}</td></tr>
                        <tr><td><strong>Subject:</strong></td><td>{enquiry.subject}</td></tr>
                        <tr><td><strong>Message:</strong></td><td>{enquiry.message}</td></tr>
                    </table>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=FROM_EMAIL,
                to_emails=admin_email,
                subject=f"Contact Form: {enquiry.subject}",
                html_content=html_content
            )
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            sg.send(message)
        except Exception as e:
            logger.error(f"Failed to send contact email: {e}")
    
    return {"message": "Message sent successfully", "enquiry_id": enquiry_doc["id"]}

# ==================== CART ENQUIRY (Checkout as Enquiry) ====================

class CartEnquiryItem(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: Optional[float] = None
    total_price: Optional[float] = None

class CartEnquiryCustomer(BaseModel):
    name: str
    email: str
    phone: str

class CartEnquiryAddress(BaseModel):
    address_line1: str
    city: str
    emirate: str

class CartEnquiryRequest(BaseModel):
    items: List[CartEnquiryItem]
    customer: CartEnquiryCustomer
    shipping_address: CartEnquiryAddress
    subtotal: Optional[float] = None
    vat: Optional[float] = None
    shipping: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    is_quotation_request: Optional[bool] = False

@api_router.post("/cart-enquiry")
async def submit_cart_enquiry(enquiry: CartEnquiryRequest, user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    """Submit entire cart as an enquiry when payment is disabled"""
    settings = await get_settings()
    
    # Create cart enquiry record
    enquiry_id = str(uuid.uuid4())
    enquiry_number = f"ENQ-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    enquiry_doc = {
        "id": enquiry_id,
        "enquiry_number": enquiry_number,
        "type": "cart_enquiry",
        "user_id": user["id"] if user else None,
        "items": [item.model_dump() for item in enquiry.items],
        "customer": enquiry.customer.model_dump(),
        "shipping_address": enquiry.shipping_address.model_dump(),
        "subtotal": enquiry.subtotal,
        "vat": enquiry.vat,
        "shipping": enquiry.shipping,
        "total": enquiry.total,
        "notes": enquiry.notes,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cart_enquiries.insert_one(enquiry_doc)
    
    # Clear the user's cart after submitting enquiry
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    if query.get("user_id") or query.get("session_id"):
        await db.carts.delete_one(query)
    
    # Send email to admin
    admin_email = settings.get("admin_notification_email") or ADMIN_EMAIL
    if SENDGRID_API_KEY and admin_email:
        try:
            items_html = ""
            for item in enquiry.items:
                items_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.product_name or 'Product'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">AED {item.unit_price or 0:.2f}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">AED {item.total_price or 0:.2f}</td>
                </tr>
                """
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 20px; text-align: center;">
                    <h1 style="color: #d4af37; margin: 0;">New Cart Enquiry</h1>
                    <p style="color: #fff; margin: 5px 0;">Enquiry #{enquiry_number}</p>
                </div>
                <div style="padding: 20px;">
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                        <strong style="color: #856404;">Action Required</strong>
                        <p style="color: #856404; margin: 5px 0 0;">A customer has submitted a cart enquiry. Please contact them to complete the order and arrange payment.</p>
                    </div>
                    
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Customer Details</h3>
                    <table style="width: 100%; margin-bottom: 20px;">
                        <tr><td><strong>Name:</strong></td><td>{enquiry.customer.name}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>{enquiry.customer.email}</td></tr>
                        <tr><td><strong>Phone:</strong></td><td>{enquiry.customer.phone}</td></tr>
                    </table>
                    
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Delivery Address</h3>
                    <p>{enquiry.shipping_address.address_line1}<br>{enquiry.shipping_address.city}, {enquiry.shipping_address.emirate}</p>
                    
                    <h3 style="color: #1e3a5f; border-bottom: 2px solid #d4af37; padding-bottom: 5px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 20px; text-align: right;">
                        <p><strong>Subtotal:</strong> AED {enquiry.subtotal:.2f}</p>
                        <p><strong>VAT:</strong> AED {enquiry.vat:.2f}</p>
                        <p><strong>Shipping:</strong> AED {enquiry.shipping:.2f}</p>
                        <p style="font-size: 18px; color: #d4af37;"><strong>Total:</strong> AED {enquiry.total:.2f}</p>
                    </div>
                    
                    {f'<h3 style="color: #1e3a5f;">Notes</h3><p>{enquiry.notes}</p>' if enquiry.notes else ''}
                </div>
                
                <div style="background: #1e3a5f; padding: 20px; text-align: center; color: #fff;">
                    <p style="margin: 0;">Please contact the customer to confirm and process this enquiry.</p>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=SENDER_EMAIL,
                to_emails=admin_email,
                subject=f"Cart Enquiry #{enquiry_number} - {enquiry.customer.name}",
                html_content=html_content
            )
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            sg.send(message)
        except Exception as e:
            logger.error(f"Failed to send cart enquiry email: {e}")
    
    # Create notification for new enquiry/quotation request
    is_quotation = enquiry.is_quotation_request if hasattr(enquiry, 'is_quotation_request') else False
    await create_notification(
        notification_type="new_enquiry",
        title="New Quotation Request" if is_quotation else "New Cart Enquiry",
        message=f"Enquiry #{enquiry_number} from {enquiry.customer.name} ({len(enquiry.items)} items)",
        data={"enquiry_id": enquiry_id, "enquiry_number": enquiry_number, "customer_name": enquiry.customer.name, "item_count": len(enquiry.items)}
    )
    
    return {"message": "Enquiry submitted successfully", "enquiry_id": enquiry_id, "enquiry_number": enquiry_number}

@api_router.get("/cart-enquiries")
async def get_cart_enquiries(admin: dict = Depends(require_admin), status: Optional[str] = None):
    """Get all cart enquiries (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    enquiries = await db.cart_enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"enquiries": enquiries}

@api_router.put("/cart-enquiries/{enquiry_id}")
async def update_cart_enquiry_status(enquiry_id: str, status: str, admin: dict = Depends(require_admin)):
    """Update cart enquiry status"""
    result = await db.cart_enquiries.update_one({"id": enquiry_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart enquiry not found")
    return {"message": "Cart enquiry updated"}

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    if not query.get("user_id") and not query.get("session_id"):
        return {"items": [], "subtotal": 0, "vat": 0, "shipping": 0, "total": 0}
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        return {"items": [], "subtotal": 0, "vat": 0, "shipping": 0, "total": 0}
    
    # Enrich with product details
    settings = await get_settings()
    enriched_items = []
    subtotal = 0
    
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("offer_price") or product.get("price", 0)
            item_total = price * item["quantity"]
            enriched_items.append({
                **item,
                "product": product,
                "unit_price": price,
                "total_price": item_total
            })
            subtotal += item_total
    
    vat = subtotal * (settings.get("vat_percentage", 5) / 100)
    shipping = 0 if subtotal >= settings.get("free_shipping_threshold", 500) else settings.get("flat_shipping_rate", 25)
    
    return {
        "items": enriched_items,
        "subtotal": round(subtotal, 2),
        "vat": round(vat, 2),
        "shipping": round(shipping, 2),
        "total": round(subtotal + vat + shipping, 2)
    }

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    # Validate product
    product = await db.products.find_one({"id": item.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.get("stock", 0) < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    query = {"user_id": user["id"]} if user else {"session_id": session_id or str(uuid.uuid4())}
    cart = await db.carts.find_one(query)
    
    if cart:
        # Check if product already in cart
        existing_item = next((i for i in cart.get("items", []) if i["product_id"] == item.product_id), None)
        if existing_item:
            await db.carts.update_one(
                {**query, "items.product_id": item.product_id},
                {"$inc": {"items.$.quantity": item.quantity}}
            )
        else:
            await db.carts.update_one(query, {"$push": {"items": item.model_dump()}})
    else:
        cart_doc = {
            **query,
            "items": [item.model_dump()],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart_doc)
    
    return {"message": "Added to cart", "session_id": query.get("session_id")}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    
    if item.quantity <= 0:
        await db.carts.update_one(query, {"$pull": {"items": {"product_id": item.product_id}}})
    else:
        await db.carts.update_one(
            {**query, "items.product_id": item.product_id},
            {"$set": {"items.$.quantity": item.quantity}}
        )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    await db.carts.update_one(query, {"$pull": {"items": {"product_id": product_id}}})
    return {"message": "Item removed"}

@api_router.delete("/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    await db.carts.delete_one(query)
    return {"message": "Cart cleared"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(order: OrderCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user), session_id: Optional[str] = None):
    settings = await get_settings()
    
    # Validate items and calculate totals
    items_data = []
    subtotal = 0
    
    for item in order.items:
        product = await db.products.find_one({"id": item.product_id, "is_active": True})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        price = product.get("offer_price") or product.get("price", 0)
        item_total = price * item.quantity
        items_data.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "sku": product["sku"],
            "quantity": item.quantity,
            "unit_price": price,
            "total_price": item_total,
            "image": product.get("images", [""])[0] if product.get("images") else ""
        })
        subtotal += item_total
    
    vat_amount = subtotal * (settings.get("vat_percentage", 5) / 100)
    shipping_cost = 0 if subtotal >= settings.get("free_shipping_threshold", 500) else settings.get("flat_shipping_rate", 25)
    total = subtotal + vat_amount + shipping_cost
    
    order_id = str(uuid.uuid4())
    order_number = generate_order_number()
    invoice_number = generate_invoice_number()
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "invoice_number": invoice_number,
        "user_id": user["id"] if user else None,
        "customer_email": user["email"] if user else order.shipping_address.full_name,
        "items": items_data,
        "shipping_address": order.shipping_address.model_dump(),
        "billing_address": order.billing_address.model_dump() if order.billing_address else order.shipping_address.model_dump(),
        "payment_method": order.payment_method,
        "subtotal": round(subtotal, 2),
        "vat_amount": round(vat_amount, 2),
        "vat_percentage": settings.get("vat_percentage", 5),
        "shipping_cost": round(shipping_cost, 2),
        "total": round(total, 2),
        "status": "pending",
        "payment_status": "pending",
        "notes": order.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Update stock
    for item in order.items:
        await db.products.update_one({"id": item.product_id}, {"$inc": {"stock": -item.quantity}})
    
    # Clear cart
    query = {"user_id": user["id"]} if user else {"session_id": session_id}
    if query.get("user_id") or query.get("session_id"):
        await db.carts.delete_one(query)
    
    # Handle payment
    if order.payment_method == "cod" or not settings.get("payment_enabled", True):
        order_doc["status"] = "confirmed"
        order_doc["payment_status"] = "cod" if order.payment_method == "cod" else "pending"
        await db.orders.update_one({"id": order_id}, {"$set": {"status": order_doc["status"], "payment_status": order_doc["payment_status"]}})
        
        # Send email notification
        background_tasks.add_task(send_order_email, order_doc, to_admin=True)
        if user:
            background_tasks.add_task(send_order_email, order_doc, to_admin=False)
    
    # Create notification for new order
    customer_name = order.shipping_address.full_name
    await create_notification(
        notification_type="new_order",
        title="New Order Received",
        message=f"Order #{order_number} from {customer_name} - AED {round(total, 2)}",
        data={"order_id": order_id, "order_number": order_number, "total": round(total, 2), "customer_name": customer_name}
    )
    
    return {
        "order_id": order_id,
        "order_number": order_number,
        "total": round(total, 2),
        "requires_payment": order.payment_method == "card" and settings.get("payment_enabled", True)
    }

@api_router.get("/orders")
async def get_orders(user: dict = Depends(require_auth), page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    query = {"user_id": user["id"]}
    
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"orders": orders, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/orders/all")
async def get_all_orders(admin: dict = Depends(require_admin), status: Optional[str] = None, page: int = 1, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"orders": orders, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    query = {"id": order_id}
    if user and user.get("role") != "admin":
        query["user_id"] = user["id"]
    
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin: dict = Depends(require_admin)):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

@api_router.get("/orders/{order_id}/invoice")
async def download_invoice(order_id: str, user: dict = Depends(get_current_user)):
    query = {"id": order_id}
    if user and user.get("role") != "admin":
        query["user_id"] = user["id"]
    
    order = await db.orders.find_one(query, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    pdf_bytes = await generate_invoice_pdf(order)
    pdf_base64 = base64.b64encode(pdf_bytes).decode()
    
    return {
        "filename": f"invoice_{order['invoice_number']}.pdf",
        "content": pdf_base64,
        "content_type": "application/pdf"
    }

# ==================== PAYMENT ROUTES ====================

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: CheckoutRequest):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse
    
    settings = await get_settings()
    if not settings.get("payment_enabled", True):
        raise HTTPException(status_code=400, detail="Online payment is disabled")
    
    order = await db.orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    webhook_url = f"{request.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{request.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/checkout/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="aed",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order["id"],
            "order_number": order["order_number"]
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "order_id": order["id"],
        "order_number": order["order_number"],
        "amount": order["total"],
        "currency": "AED",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def check_payment_status(session_id: str, background_tasks: BackgroundTasks):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutStatusResponse
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and order
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if transaction:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if status.payment_status == "paid":
            order = await db.orders.find_one({"id": transaction["order_id"]}, {"_id": 0})
            if order and order.get("payment_status") != "paid":
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Send confirmation emails
                order["payment_status"] = "paid"
                order["status"] = "confirmed"
                background_tasks.add_task(send_order_email, order, to_admin=True)
                background_tasks.add_task(send_order_email, order, to_admin=False)
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                order = await db.orders.find_one({"id": order_id}, {"_id": 0})
                if order and order.get("payment_status") != "paid":
                    await db.orders.update_one(
                        {"id": order_id},
                        {"$set": {"payment_status": "paid", "status": "confirmed", "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    order["payment_status"] = "paid"
                    order["status"] = "confirmed"
                    background_tasks.add_task(send_order_email, order, to_admin=True)
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings")
async def get_public_settings():
    settings = await get_settings()
    # Return only public settings
    return {
        "payment_enabled": settings.get("payment_enabled", True),
        "cod_enabled": settings.get("cod_enabled", True),
        "vat_percentage": settings.get("vat_percentage", 5),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 500),
        "company_name": settings.get("company_name", ""),
        "company_phone": settings.get("company_phone", ""),
        "whatsapp_number": settings.get("whatsapp_number", ""),
        "delivery_emirates": settings.get("delivery_emirates", []),
        "show_prices": settings.get("show_prices", True),
        "hero_slides": settings.get("hero_slides", [])
    }

@api_router.get("/settings/admin")
async def get_admin_settings(admin: dict = Depends(require_admin)):
    return await get_settings()

@api_router.put("/settings")
async def update_settings(settings: SettingsUpdate, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    await db.settings.update_one({"id": "global"}, {"$set": update_data}, upsert=True)
    return {"message": "Settings updated"}

# ==================== HERO SLIDES ROUTES ====================

@api_router.get("/hero-slides")
async def get_hero_slides():
    """Get hero slides for homepage banner"""
    settings = await get_settings()
    return {"slides": settings.get("hero_slides", [])}

@api_router.put("/hero-slides")
async def update_hero_slides(data: dict, admin: dict = Depends(require_admin)):
    """Update hero slides (admin only)"""
    slides = data.get("slides", [])
    # Validate each slide has required fields
    for slide in slides:
        if not slide.get("image") or not slide.get("title"):
            raise HTTPException(status_code=400, detail="Each slide must have an image and title")
    await db.settings.update_one({"id": "global"}, {"$set": {"hero_slides": slides}}, upsert=True)
    return {"message": "Hero slides updated", "count": len(slides)}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(admin: dict = Depends(require_admin)):
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_active": True})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    total_customers = await db.users.count_documents({"role": "customer"})
    
    # Revenue calculation
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_customers": total_customers,
        "total_revenue": round(total_revenue, 2)
    }

@api_router.get("/dashboard/recent-orders")
async def get_recent_orders(admin: dict = Depends(require_admin), limit: int = 10):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return orders

# ==================== CUSTOMERS ROUTES ====================

@api_router.get("/customers")
async def get_customers(admin: dict = Depends(require_admin), page: int = 1, limit: int = 50):
    skip = (page - 1) * limit
    total = await db.users.count_documents({"role": "customer"})
    customers = await db.users.find({"role": "customer"}, {"_id": 0, "password": 0, "email_otp": 0, "phone_otp": 0}).skip(skip).limit(limit).to_list(limit)
    return {"customers": customers, "total": total, "page": page, "pages": (total + limit - 1) // limit}

# ==================== ADMIN USER VERIFICATION MANAGEMENT ====================

@api_router.post("/admin/users/{user_id}/verify-email")
async def admin_verify_email(user_id: str, admin: dict = Depends(require_admin)):
    """Admin: Manually verify a user's email"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "email_verified": True,
            "email_otp": None,
            "email_otp_expiry": None,
            "email_otp_attempts": 0,
            "email_otp_locked_until": None
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User email verified manually by admin"}

@api_router.post("/admin/users/{user_id}/resend-otp")
async def admin_resend_otp(user_id: str, admin: dict = Depends(require_admin), background_tasks: BackgroundTasks = None):
    """Admin: Resend OTP to a user"""
    db_user = await db.users.find_one({"id": user_id})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.get("email_verified"):
        raise HTTPException(status_code=400, detail="User email is already verified")
    
    # Generate new OTP
    new_otp = generate_otp()
    new_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    # Update user
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "email_otp": new_otp,
            "email_otp_expiry": new_expiry.isoformat(),
            "email_otp_attempts": 0,
            "email_otp_locked_until": None,
            "last_email_otp_sent_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send OTP email
    if background_tasks:
        background_tasks.add_task(send_otp_email, db_user["email"], new_otp, db_user.get("name", "User"))
    else:
        await send_otp_email(db_user["email"], new_otp, db_user.get("name", "User"))
    
    return {"message": f"OTP sent to {db_user['email']}"}

@api_router.post("/admin/users/{user_id}/toggle-status")
async def admin_toggle_user_status(user_id: str, admin: dict = Depends(require_admin)):
    """Admin: Enable/Disable a user account"""
    db_user = await db.users.find_one({"id": user_id})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not db_user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"User {'enabled' if new_status else 'disabled'}", "is_active": new_status}

@api_router.get("/admin/customers")
async def get_admin_customers(admin: dict = Depends(require_admin), page: int = 1, limit: int = 100):
    """Admin: Get all customers with verification status"""
    skip = (page - 1) * limit
    total = await db.users.count_documents({"role": "customer"})
    customers = await db.users.find(
        {"role": "customer"}, 
        {"_id": 0, "password": 0, "email_otp": 0, "phone_otp": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    # Ensure email_verified field exists for all customers (default to False for older users)
    for customer in customers:
        if "email_verified" not in customer:
            customer["email_verified"] = False
        if "is_active" not in customer:
            customer["is_active"] = True
    
    return {"customers": customers, "total": total, "page": page, "pages": (total + limit - 1) // limit}

# ==================== ERP-LITE: ENHANCED DASHBOARD ====================

@api_router.get("/erp/dashboard/kpis")
async def get_erp_dashboard_kpis(admin: dict = Depends(require_admin)):
    """Get comprehensive ERP-style dashboard KPIs"""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    # Order KPIs
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "new"]}})
    completed_orders = await db.orders.count_documents({"status": {"$in": ["delivered", "closed"]}})
    cancelled_orders = await db.orders.count_documents({"status": "cancelled"})
    
    # Financial KPIs - Total Revenue from completed orders
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["delivered", "closed", "invoiced"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Paid Amount
    paid_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    paid_result = await db.orders.aggregate(paid_pipeline).to_list(1)
    paid_amount = paid_result[0]["total"] if paid_result else 0
    
    # Unpaid/Outstanding Amount
    unpaid_pipeline = [
        {"$match": {"payment_status": {"$in": ["pending", "unpaid", "partial", "cod"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    unpaid_result = await db.orders.aggregate(unpaid_pipeline).to_list(1)
    unpaid_amount = unpaid_result[0]["total"] if unpaid_result else 0
    
    # Product KPIs
    total_products = await db.products.count_documents({})
    low_stock_products = await db.products.count_documents({
        "$expr": {"$lte": ["$stock", {"$ifNull": ["$reorder_level", 10]}]}
    })
    out_of_stock_products = await db.products.count_documents({"stock": {"$lte": 0}})
    
    # Total Stock Value (cost_price * stock)
    stock_value_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {
            "_id": None, 
            "total": {"$sum": {"$multiply": [
                {"$ifNull": ["$cost_price", {"$multiply": ["$price", 0.7]}]},  # Default cost = 70% of price
                "$stock"
            ]}}
        }}
    ]
    stock_value_result = await db.products.aggregate(stock_value_pipeline).to_list(1)
    total_stock_value = stock_value_result[0]["total"] if stock_value_result else 0
    
    # Customer KPIs
    total_customers = await db.users.count_documents({"role": "customer"})
    new_customers_30_days = await db.users.count_documents({
        "role": "customer",
        "created_at": {"$gte": thirty_days_ago.isoformat()}
    })
    verified_customers = await db.users.count_documents({
        "role": "customer",
        "email_verified": True
    })
    
    # Invoice KPIs
    total_invoices = await db.invoices.count_documents({})
    unpaid_invoices = await db.invoices.count_documents({"payment_status": {"$in": ["unpaid", "draft"]}})
    overdue_invoices = await db.invoices.count_documents({
        "payment_status": {"$in": ["unpaid", "overdue"]},
        "due_date": {"$lt": now.isoformat()}
    })
    
    # Monthly Revenue (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        if i > 0:
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        else:
            month_end = now
        
        month_pipeline = [
            {"$match": {
                "created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()},
                "status": {"$nin": ["cancelled"]}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]
        month_result = await db.orders.aggregate(month_pipeline).to_list(1)
        monthly_revenue.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": round(month_result[0]["total"], 2) if month_result else 0
        })
    
    # Order Status Distribution
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_result = await db.orders.aggregate(status_pipeline).to_list(20)
    order_status_distribution = [
        {"status": item["_id"] or "unknown", "count": item["count"]}
        for item in status_result
    ]
    
    return {
        # Order KPIs
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        
        # Financial KPIs
        "total_revenue": round(total_revenue, 2),
        "paid_amount": round(paid_amount, 2),
        "unpaid_amount": round(unpaid_amount, 2),
        
        # Product KPIs
        "total_products": total_products,
        "low_stock_products": low_stock_products,
        "out_of_stock_products": out_of_stock_products,
        "total_stock_value": round(total_stock_value, 2),
        
        # Customer KPIs
        "total_customers": total_customers,
        "new_customers_30_days": new_customers_30_days,
        "verified_customers": verified_customers,
        
        # Invoice KPIs
        "total_invoices": total_invoices,
        "unpaid_invoices": unpaid_invoices,
        "overdue_invoices": overdue_invoices,
        
        # Charts data
        "monthly_revenue": monthly_revenue,
        "order_status_distribution": order_status_distribution
    }

# ==================== ERP-LITE: INVOICE MANAGEMENT ====================

async def get_next_invoice_number() -> str:
    """Generate next invoice number in format INV-0001"""
    settings = await get_settings()
    prefix = settings.get("invoice_prefix", "INV-")
    
    # Get the last invoice
    last_invoice = await db.invoices.find_one(
        {}, 
        {"invoice_number": 1, "_id": 0},
        sort=[("created_at", -1)]
    )
    
    if last_invoice and last_invoice.get("invoice_number"):
        try:
            num_str = last_invoice["invoice_number"].replace(prefix, "")
            next_num = int(num_str) + 1
        except:
            next_num = settings.get("invoice_starting_number", 1)
    else:
        next_num = settings.get("invoice_starting_number", 1)
    
    return f"{prefix}{str(next_num).zfill(4)}"

class InvoiceCreate(BaseModel):
    order_id: str
    due_date: Optional[str] = None
    discount: float = 0.0
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    due_date: Optional[str] = None
    payment_status: Optional[str] = None
    paid_amount: Optional[float] = None
    discount: Optional[float] = None
    notes: Optional[str] = None

class PaymentRecord(BaseModel):
    invoice_id: str
    amount: float
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None

@api_router.post("/erp/invoices")
async def create_invoice(data: InvoiceCreate, admin: dict = Depends(require_admin)):
    """Create invoice from order"""
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if invoice already exists for this order
    existing = await db.invoices.find_one({"order_id": data.order_id})
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this order")
    
    settings = await get_settings()
    invoice_number = await get_next_invoice_number()
    
    # Get customer info
    customer = None
    if order.get("user_id"):
        customer = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "password": 0})
    
    # Calculate totals
    subtotal = order.get("subtotal", 0)
    discount = data.discount
    tax_rate = settings.get("vat_percentage", 5)
    tax_amount = (subtotal - discount) * (tax_rate / 100)
    shipping = order.get("shipping_cost", 0)
    total_amount = subtotal - discount + tax_amount + shipping
    
    # Set due date (default 30 days from now)
    if data.due_date:
        due_date = data.due_date
    else:
        due_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "order_id": data.order_id,
        "order_number": order.get("order_number"),
        "customer_id": order.get("user_id"),
        "customer_name": order.get("shipping_address", {}).get("full_name", customer.get("name") if customer else ""),
        "customer_email": order.get("customer_email", customer.get("email") if customer else ""),
        "customer_phone": order.get("shipping_address", {}).get("phone", customer.get("phone") if customer else ""),
        "customer_address": order.get("shipping_address"),
        
        "invoice_date": datetime.now(timezone.utc).isoformat(),
        "due_date": due_date,
        
        "items": [
            {
                "description": item.get("product_name"),
                "sku": item.get("sku"),
                "quantity": item.get("quantity"),
                "unit_price": item.get("unit_price"),
                "total": item.get("total_price")
            }
            for item in order.get("items", [])
        ],
        
        "subtotal": round(subtotal, 2),
        "tax_rate": tax_rate,
        "tax_amount": round(tax_amount, 2),
        "discount": round(discount, 2),
        "shipping": round(shipping, 2),
        "total_amount": round(total_amount, 2),
        
        "payment_status": "unpaid",
        "paid_amount": 0.0,
        
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    # Update order status to invoiced
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"status": "invoiced", "invoice_number": invoice_number, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"invoice_id": invoice_doc["id"], "invoice_number": invoice_number, "message": "Invoice created successfully"}

@api_router.get("/erp/invoices")
async def get_invoices(
    admin: dict = Depends(require_admin),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get all invoices with optional status filter"""
    query = {}
    if status:
        query["payment_status"] = status
    
    skip = (page - 1) * limit
    total = await db.invoices.count_documents(query)
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {"invoices": invoices, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/erp/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, admin: dict = Depends(require_admin)):
    """Get single invoice"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@api_router.put("/erp/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, data: InvoiceUpdate, admin: dict = Depends(require_admin)):
    """Update invoice"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": "Invoice updated successfully"}

@api_router.post("/erp/invoices/{invoice_id}/record-payment")
async def record_invoice_payment(invoice_id: str, data: PaymentRecord, admin: dict = Depends(require_admin)):
    """Record payment against invoice"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    new_paid_amount = invoice.get("paid_amount", 0) + data.amount
    total_amount = invoice.get("total_amount", 0)
    
    # Determine payment status
    if new_paid_amount >= total_amount:
        payment_status = "paid"
    elif new_paid_amount > 0:
        payment_status = "partial"
    else:
        payment_status = "unpaid"
    
    # Record payment in history
    payment_record = {
        "id": str(uuid.uuid4()),
        "amount": data.amount,
        "payment_method": data.payment_method,
        "reference": data.reference,
        "notes": data.notes,
        "recorded_by": admin["id"],
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {
            "$set": {
                "paid_amount": round(new_paid_amount, 2),
                "payment_status": payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"payment_history": payment_record}
        }
    )
    
    # Update order payment status if fully paid
    if payment_status == "paid" and invoice.get("order_id"):
        await db.orders.update_one(
            {"id": invoice["order_id"]},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Payment recorded", "new_paid_amount": round(new_paid_amount, 2), "payment_status": payment_status}

@api_router.get("/erp/invoices/{invoice_id}/pdf")
async def download_erp_invoice_pdf(invoice_id: str, admin: dict = Depends(require_admin)):
    """Download invoice as PDF"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    settings = await get_settings()
    pdf_bytes = await generate_erp_invoice_pdf(invoice, settings)
    pdf_base64 = base64.b64encode(pdf_bytes).decode()
    
    return {
        "filename": f"{invoice['invoice_number']}.pdf",
        "content": pdf_base64,
        "content_type": "application/pdf"
    }

async def generate_erp_invoice_pdf(invoice: dict, settings: dict) -> bytes:
    """Generate professional invoice PDF with customizable columns"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=28, textColor=colors.HexColor('#1e3a5f'), alignment=TA_CENTER, spaceAfter=5)
    company_style = ParagraphStyle('Company', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#666666'), alignment=TA_CENTER)
    header_style = ParagraphStyle('Header', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1e3a5f'), spaceAfter=10)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=10, leading=14)
    invoice_title = ParagraphStyle('InvoiceTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#d4af37'), alignment=TA_RIGHT)
    
    # Company Info
    company_name = settings.get('company_name', 'Grand Palace General Trading')
    company_address = settings.get('company_address', 'Dubai, UAE')
    company_phone = settings.get('company_phone', '+971 4 456 7890')
    company_email = settings.get('company_email', 'info@gpgt.ae')
    company_trn = settings.get('company_trn', '') or settings.get('vat_trn', '')
    
    # Header
    elements.append(Paragraph(company_name, title_style))
    elements.append(Paragraph(f"{company_address} | Tel: {company_phone} | Email: {company_email}", company_style))
    if company_trn:
        elements.append(Paragraph(f"TRN: {company_trn}", company_style))
    elements.append(Spacer(1, 20))
    
    # Invoice title
    elements.append(Paragraph("TAX INVOICE", invoice_title))
    elements.append(Spacer(1, 10))
    
    # Invoice info
    status_color = '#28a745' if invoice.get('payment_status') == 'paid' else '#dc3545'
    invoice_info = [
        ["Invoice Number:", invoice.get('invoice_number', ''), "Invoice Date:", invoice.get('invoice_date', '')[:10] if invoice.get('invoice_date') else ''],
        ["Order Number:", invoice.get('order_number', ''), "Due Date:", invoice.get('due_date', '')[:10] if invoice.get('due_date') else 'On Receipt'],
        ["Status:", invoice.get('payment_status', 'UNPAID').upper(), "", ""]
    ]
    info_table = Table(invoice_info, colWidths=[90, 150, 90, 150])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor(status_color)),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Bill To
    elements.append(Paragraph("Bill To:", header_style))
    address = invoice.get('customer_address', {}) or {}
    customer_info = f"<b>{invoice.get('customer_name', '')}</b><br/>"
    if address.get('address_line1'):
        customer_info += f"{address.get('address_line1', '')}<br/>"
    if address.get('city') or address.get('emirate'):
        customer_info += f"{address.get('city', '')}, {address.get('emirate', '')}<br/>"
    customer_info += f"Phone: {invoice.get('customer_phone', '')}<br/>"
    customer_info += f"Email: {invoice.get('customer_email', '')}"
    elements.append(Paragraph(customer_info, normal_style))
    elements.append(Spacer(1, 20))
    
    # Items table
    elements.append(Paragraph("Invoice Items:", header_style))
    
    # Build items table with customizable columns
    invoice_columns = settings.get('invoice_columns', [
        {"key": "item", "label": "Item Description", "visible": True},
        {"key": "quantity", "label": "Qty", "visible": True},
        {"key": "unit_price", "label": "Unit Price", "visible": True},
        {"key": "total", "label": "Total", "visible": True}
    ])
    
    header_row = ["#"]
    for col in invoice_columns:
        if col.get("visible", True):
            header_row.append(col.get("label", col.get("key", "")))
    
    items_data = [header_row]
    currency = settings.get('currency', 'AED')
    
    for idx, item in enumerate(invoice.get('items', []), 1):
        row = [str(idx)]
        for col in invoice_columns:
            if col.get("visible", True):
                key = col.get("key", "")
                if key == "item":
                    row.append(item.get('description', item.get('product_name', '')))
                elif key == "quantity":
                    row.append(str(item.get('quantity', 0)))
                elif key == "unit_price":
                    row.append(f"{currency} {item.get('unit_price', 0):.2f}")
                elif key == "total":
                    row.append(f"{currency} {item.get('total', item.get('total_price', 0)):.2f}")
                else:
                    row.append(str(item.get(key, '')))
        items_data.append(row)
    
    num_cols = len(header_row)
    col_widths = [30] + [int((450 - 30) / (num_cols - 1))] * (num_cols - 1)
    
    items_table = Table(items_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Totals
    vat_rate = settings.get('vat_percentage', 5)
    totals_data = [
        ["Subtotal:", f"{currency} {invoice.get('subtotal', 0):.2f}"],
    ]
    if invoice.get('discount', 0) > 0:
        totals_data.append(["Discount:", f"-{currency} {invoice.get('discount', 0):.2f}"])
    totals_data.append([f"VAT ({vat_rate}%):", f"{currency} {invoice.get('tax_amount', 0):.2f}"])
    if invoice.get('shipping', 0) > 0:
        totals_data.append(["Shipping:", f"{currency} {invoice.get('shipping', 0):.2f}"])
    totals_data.append(["TOTAL:", f"{currency} {invoice.get('total_amount', 0):.2f}"])
    if invoice.get('paid_amount', 0) > 0:
        totals_data.append(["Paid:", f"-{currency} {invoice.get('paid_amount', 0):.2f}"])
        balance = invoice.get('total_amount', 0) - invoice.get('paid_amount', 0)
        totals_data.append(["Balance Due:", f"{currency} {balance:.2f}"])
    
    totals_table = Table(totals_data, colWidths=[380, 100])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#d4af37')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#d4af37')),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 30))
    
    # Bank details
    if settings.get('show_bank_details') and settings.get('bank_details'):
        bank = settings['bank_details']
        elements.append(Paragraph("Bank Details:", header_style))
        bank_info = f"Bank: {bank.get('bank_name', '')}<br/>"
        bank_info += f"Account Name: {bank.get('account_name', '')}<br/>"
        bank_info += f"Account Number: {bank.get('account_number', '')}<br/>"
        if bank.get('iban'):
            bank_info += f"IBAN: {bank.get('iban', '')}<br/>"
        if bank.get('swift_code'):
            bank_info += f"Swift Code: {bank.get('swift_code', '')}"
        elements.append(Paragraph(bank_info, normal_style))
        elements.append(Spacer(1, 20))
    
    # Notes
    if invoice.get('notes'):
        elements.append(Paragraph("Notes:", header_style))
        elements.append(Paragraph(invoice['notes'], normal_style))
        elements.append(Spacer(1, 10))
    
    # Terms
    terms = settings.get('invoice_terms', 'Payment due within 30 days.')
    if terms:
        elements.append(Paragraph("Terms & Conditions:", header_style))
        elements.append(Paragraph(terms, normal_style))
        elements.append(Spacer(1, 20))
    
    # Footer
    footer_text = settings.get('invoice_footer_text', 'Thank you for your business!')
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#888888'), alignment=TA_CENTER)
    elements.append(Paragraph(footer_text, footer_style))
    elements.append(Paragraph(f"{company_name} - Your Trusted Partner", footer_style))
    
    doc.build(elements)
    return buffer.getvalue()

@api_router.post("/erp/invoices/{invoice_id}/send-email")
async def send_invoice_email(invoice_id: str, background_tasks: BackgroundTasks, admin: dict = Depends(require_admin)):
    """Send invoice to customer via email"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if not invoice.get("customer_email"):
        raise HTTPException(status_code=400, detail="Customer email not available")
    
    settings = await get_settings()
    
    # Generate PDF
    pdf_bytes = await generate_erp_invoice_pdf(invoice, settings)
    pdf_base64 = base64.b64encode(pdf_bytes).decode()
    
    # Send email with attachment
    if not SENDGRID_API_KEY:
        return {"message": "Email service not configured", "status": "skipped"}
    
    try:
        company_name = settings.get("company_name", "Grand Palace General Trading")
        currency = settings.get("currency", "AED")
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2a4a70 100%); padding: 30px; text-align: center;">
                <h1 style="color: #d4af37; margin: 0;">{company_name}</h1>
                <p style="color: #fff; margin: 10px 0;">Invoice #{invoice['invoice_number']}</p>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #1e3a5f;">Dear {invoice.get('customer_name', 'Customer')},</h2>
                <p>Please find attached your invoice for order #{invoice.get('order_number', '')}.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%;">
                        <tr><td style="padding: 5px 0;"><strong>Invoice Number:</strong></td><td style="text-align: right;">{invoice['invoice_number']}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Invoice Date:</strong></td><td style="text-align: right;">{invoice.get('invoice_date', '')[:10]}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Due Date:</strong></td><td style="text-align: right;">{invoice.get('due_date', '')[:10] if invoice.get('due_date') else 'On Receipt'}</td></tr>
                        <tr><td style="padding: 5px 0; border-top: 2px solid #d4af37;"><strong style="font-size: 18px;">Total Amount:</strong></td><td style="text-align: right; border-top: 2px solid #d4af37;"><strong style="font-size: 18px; color: #d4af37;">{currency} {invoice.get('total_amount', 0):.2f}</strong></td></tr>
                    </table>
                </div>
                
                <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            </div>
            <div style="background: #1e3a5f; padding: 20px; text-align: center;">
                <p style="color: #fff; margin: 0;">{settings.get('company_phone', '')} | {settings.get('company_email', '')}</p>
                <p style="color: #d4af37; margin: 5px 0 0;">Thank you for your business!</p>
            </div>
        </body>
        </html>
        """
        
        from sendgrid.helpers.mail import Attachment, FileContent, FileName, FileType, Disposition
        
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=invoice["customer_email"],
            subject=f"Invoice {invoice['invoice_number']} from {company_name}",
            html_content=html_content
        )
        
        # Attach PDF
        attachment = Attachment(
            FileContent(pdf_base64),
            FileName(f"{invoice['invoice_number']}.pdf"),
            FileType('application/pdf'),
            Disposition('attachment')
        )
        message.attachment = attachment
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        
        # Update invoice status to sent
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {"payment_status": "sent" if invoice.get("payment_status") == "draft" else invoice.get("payment_status"), "sent_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Invoice sent successfully", "status": "sent"}
    except Exception as e:
        logger.error(f"Failed to send invoice email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ==================== ERP-LITE: ENHANCED ORDER MANAGEMENT ====================

ORDER_STATUSES = [
    "new", "confirmed", "processing", "ready_to_ship", 
    "shipped", "delivered", "invoiced", "closed", "cancelled"
]

@api_router.get("/erp/orders")
async def get_erp_orders(
    admin: dict = Depends(require_admin),
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get orders with ERP-enhanced data"""
    query = {}
    if status:
        query["status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    
    skip = (page - 1) * limit
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with invoice info
    for order in orders:
        invoice = await db.invoices.find_one({"order_id": order["id"]}, {"_id": 0, "invoice_number": 1, "payment_status": 1})
        order["invoice"] = invoice
    
    return {"orders": orders, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.put("/erp/orders/{order_id}/status")
async def update_erp_order_status(order_id: str, status: str, admin: dict = Depends(require_admin)):
    """Update order status with ERP lifecycle"""
    if status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {', '.join(ORDER_STATUSES)}")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Add status history entry
    status_entry = {
        "status": status,
        "changed_by": admin["id"],
        "changed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"status_history": status_entry}
        }
    )
    
    return {"message": f"Order status updated to {status}"}

@api_router.get("/erp/orders/{order_id}/timeline")
async def get_order_timeline(order_id: str, admin: dict = Depends(require_admin)):
    """Get order status timeline"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    timeline = order.get("status_history", [])
    if not timeline:
        # Create initial entry
        timeline = [{
            "status": "new",
            "changed_at": order.get("created_at")
        }]
    
    return {"order_id": order_id, "current_status": order.get("status"), "timeline": timeline}

# ==================== ERP-LITE: CUSTOMER ERP VIEW ====================

@api_router.get("/erp/customers")
async def get_erp_customers(
    admin: dict = Depends(require_admin),
    filter_type: Optional[str] = None,  # high_value, pending_payments, new
    page: int = 1,
    limit: int = 50
):
    """Get customers with ERP-enhanced data"""
    query = {"role": "customer"}
    
    skip = (page - 1) * limit
    customers = await db.users.find(query, {"_id": 0, "password": 0, "email_otp": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with order/payment stats
    enriched_customers = []
    for customer in customers:
        # Get order stats
        orders = await db.orders.find({"user_id": customer["id"]}, {"_id": 0}).to_list(1000)
        
        total_orders = len(orders)
        total_purchase_value = sum(o.get("total", 0) for o in orders)
        total_paid = sum(o.get("total", 0) for o in orders if o.get("payment_status") == "paid")
        outstanding_balance = total_purchase_value - total_paid
        last_order_date = orders[0].get("created_at") if orders else None
        
        customer_data = {
            **customer,
            "total_orders": total_orders,
            "total_purchase_value": round(total_purchase_value, 2),
            "total_paid_amount": round(total_paid, 2),
            "outstanding_balance": round(outstanding_balance, 2),
            "last_order_date": last_order_date,
            "email_verified": customer.get("email_verified", False),
            "phone_verified": customer.get("phone_verified", False),
            "is_active": customer.get("is_active", True)
        }
        
        # Apply filters
        if filter_type == "high_value" and total_purchase_value < 5000:
            continue
        if filter_type == "pending_payments" and outstanding_balance <= 0:
            continue
        
        enriched_customers.append(customer_data)
    
    return {"customers": enriched_customers, "total": len(enriched_customers)}

@api_router.get("/erp/customers/{customer_id}")
async def get_erp_customer_detail(customer_id: str, admin: dict = Depends(require_admin)):
    """Get detailed customer ERP view"""
    customer = await db.users.find_one({"id": customer_id}, {"_id": 0, "password": 0, "email_otp": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get all orders
    orders = await db.orders.find({"user_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get all invoices
    invoices = await db.invoices.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Calculate stats
    total_orders = len(orders)
    total_purchase_value = sum(o.get("total", 0) for o in orders)
    total_paid = sum(o.get("total", 0) for o in orders if o.get("payment_status") == "paid")
    outstanding_balance = total_purchase_value - total_paid
    
    return {
        **customer,
        "total_orders": total_orders,
        "total_purchase_value": round(total_purchase_value, 2),
        "total_paid_amount": round(total_paid, 2),
        "outstanding_balance": round(outstanding_balance, 2),
        "last_order_date": orders[0].get("created_at") if orders else None,
        "orders": orders[:10],  # Last 10 orders
        "invoices": invoices[:10]  # Last 10 invoices
    }

# ==================== ERP-LITE: REPORTS ====================

class ReportRequest(BaseModel):
    report_type: str  # sales, invoice, payments, products, customers, stock
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = "json"  # json, csv

@api_router.post("/erp/reports/generate")
async def generate_report(data: ReportRequest, admin: dict = Depends(require_admin)):
    """Generate various reports"""
    now = datetime.now(timezone.utc)
    start_date = data.start_date or (now - timedelta(days=30)).isoformat()
    end_date = data.end_date or now.isoformat()
    
    date_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    
    if data.report_type == "sales":
        # Daily sales report
        pipeline = [
            {"$match": {**date_query, "status": {"$nin": ["cancelled"]}}},
            {"$group": {
                "_id": {"$substr": ["$created_at", 0, 10]},
                "order_count": {"$sum": 1},
                "total_revenue": {"$sum": "$total"},
                "total_paid": {"$sum": {"$cond": [{"$eq": ["$payment_status", "paid"]}, "$total", 0]}},
            }},
            {"$sort": {"_id": -1}}
        ]
        result = await db.orders.aggregate(pipeline).to_list(100)
        report_data = [
            {
                "date": item["_id"],
                "order_count": item["order_count"],
                "total_revenue": round(item["total_revenue"], 2),
                "total_paid": round(item["total_paid"], 2),
                "total_unpaid": round(item["total_revenue"] - item["total_paid"], 2)
            }
            for item in result
        ]
        
    elif data.report_type == "invoice":
        invoices = await db.invoices.find(date_query, {"_id": 0}).sort("created_at", -1).to_list(500)
        report_data = invoices
        
    elif data.report_type == "payments":
        pipeline = [
            {"$match": {"payment_status": {"$in": ["unpaid", "partial"]}}},
            {"$group": {
                "_id": "$customer_id",
                "total_outstanding": {"$sum": {"$subtract": ["$total_amount", {"$ifNull": ["$paid_amount", 0]}]}},
                "invoice_count": {"$sum": 1}
            }},
            {"$sort": {"total_outstanding": -1}}
        ]
        result = await db.invoices.aggregate(pipeline).to_list(100)
        
        # Enrich with customer names
        report_data = []
        for item in result:
            customer = await db.users.find_one({"id": item["_id"]}, {"_id": 0, "name": 1, "email": 1})
            report_data.append({
                "customer_id": item["_id"],
                "customer_name": customer.get("name", "N/A") if customer else "N/A",
                "customer_email": customer.get("email", "N/A") if customer else "N/A",
                "total_outstanding": round(item["total_outstanding"], 2),
                "invoice_count": item["invoice_count"]
            })
            
    elif data.report_type == "products":
        # Top selling products
        pipeline = [
            {"$match": date_query},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "sku": {"$first": "$items.sku"},
                "quantity_sold": {"$sum": "$items.quantity"},
                "revenue": {"$sum": "$items.total_price"}
            }},
            {"$sort": {"revenue": -1}},
            {"$limit": 50}
        ]
        result = await db.orders.aggregate(pipeline).to_list(50)
        report_data = [
            {
                "product_id": item["_id"],
                "product_name": item["product_name"],
                "sku": item["sku"],
                "quantity_sold": item["quantity_sold"],
                "revenue": round(item["revenue"], 2)
            }
            for item in result
        ]
        
    elif data.report_type == "customers":
        # Top customers
        pipeline = [
            {"$match": date_query},
            {"$group": {
                "_id": "$user_id",
                "total_orders": {"$sum": 1},
                "total_spent": {"$sum": "$total"}
            }},
            {"$sort": {"total_spent": -1}},
            {"$limit": 50}
        ]
        result = await db.orders.aggregate(pipeline).to_list(50)
        
        report_data = []
        for item in result:
            if item["_id"]:
                customer = await db.users.find_one({"id": item["_id"]}, {"_id": 0, "name": 1, "email": 1})
                report_data.append({
                    "customer_id": item["_id"],
                    "customer_name": customer.get("name", "N/A") if customer else "N/A",
                    "email": customer.get("email", "N/A") if customer else "N/A",
                    "total_orders": item["total_orders"],
                    "total_spent": round(item["total_spent"], 2)
                })
                
    elif data.report_type == "stock":
        # Low stock report
        products = await db.products.find(
            {"$expr": {"$lte": ["$stock", {"$ifNull": ["$reorder_level", 10]}]}},
            {"_id": 0}
        ).sort("stock", 1).to_list(100)
        report_data = [
            {
                "product_id": p["id"],
                "product_name": p["name"],
                "sku": p["sku"],
                "current_stock": p.get("stock", 0),
                "reorder_level": p.get("reorder_level", 10),
                "status": "Out of Stock" if p.get("stock", 0) <= 0 else "Low Stock"
            }
            for p in products
        ]
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Convert to CSV if requested
    if data.format == "csv":
        import csv
        from io import StringIO
        
        if report_data:
            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
            writer.writeheader()
            writer.writerows(report_data)
            csv_content = output.getvalue()
            
            return {
                "format": "csv",
                "content": base64.b64encode(csv_content.encode()).decode(),
                "filename": f"{data.report_type}_report_{now.strftime('%Y%m%d')}.csv"
            }
    
    return {
        "report_type": data.report_type,
        "start_date": start_date,
        "end_date": end_date,
        "generated_at": now.isoformat(),
        "data": report_data
    }

# ==================== ERP-LITE: SETTINGS ====================

class ERPSettingsUpdate(BaseModel):
    company_logo: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_starting_number: Optional[int] = None
    currency: Optional[str] = None
    vat_trn: Optional[str] = None
    invoice_columns: Optional[List[Dict[str, Any]]] = None
    invoice_footer_text: Optional[str] = None
    invoice_terms: Optional[str] = None
    show_bank_details: Optional[bool] = None
    bank_details: Optional[Dict[str, str]] = None
    show_prices: Optional[bool] = None
    whatsapp_number: Optional[str] = None

@api_router.put("/erp/settings")
async def update_erp_settings(data: ERPSettingsUpdate, admin: dict = Depends(require_admin)):
    """Update ERP-specific settings"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    await db.settings.update_one({"id": "global"}, {"$set": update_data}, upsert=True)
    return {"message": "ERP settings updated"}

@api_router.get("/erp/settings")
async def get_erp_settings(admin: dict = Depends(require_admin)):
    """Get ERP-specific settings"""
    settings = await get_settings()
    
    # Add default ERP settings if not present
    erp_defaults = {
        "invoice_prefix": "INV-",
        "invoice_starting_number": 1,
        "currency": "AED",
        "vat_trn": "",
        "invoice_columns": [
            {"key": "item", "label": "Item Description", "visible": True},
            {"key": "quantity", "label": "Qty", "visible": True},
            {"key": "unit_price", "label": "Unit Price", "visible": True},
            {"key": "total", "label": "Total", "visible": True}
        ],
        "invoice_footer_text": "Thank you for your business!",
        "invoice_terms": "Payment due within 30 days.",
        "show_bank_details": False,
        "bank_details": None,
        "company_logo": None,
        "show_prices": True
    }
    
    return {**erp_defaults, **settings}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(admin: dict = Depends(require_admin), unread_only: bool = False, limit: int = 50):
    """Get admin notifications"""
    query = {}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    unread_count = await db.notifications.count_documents({"read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, admin: dict = Depends(require_admin)):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(admin: dict = Depends(require_admin)):
    """Mark all notifications as read"""
    await db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, admin: dict = Depends(require_admin)):
    """Delete a notification"""
    result = await db.notifications.delete_one({"id": notification_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

# ==================== ERP-LITE: PRODUCT ENHANCEMENTS ====================

class ProductERPUpdate(BaseModel):
    cost_price: Optional[float] = None
    reorder_level: Optional[int] = None
    supplier_name: Optional[str] = None
    supplier_code: Optional[str] = None

@api_router.put("/erp/products/{product_id}")
async def update_product_erp_fields(product_id: str, data: ProductERPUpdate, admin: dict = Depends(require_admin)):
    """Update product ERP fields"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product ERP fields updated"}

@api_router.get("/erp/products/low-stock")
async def get_low_stock_products(admin: dict = Depends(require_admin)):
    """Get products with low stock"""
    products = await db.products.find(
        {"$expr": {"$lte": ["$stock", {"$ifNull": ["$reorder_level", 10]}]}},
        {"_id": 0}
    ).sort("stock", 1).to_list(100)
    
    return {
        "products": products,
        "total": len(products)
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing"""
    # Check if already seeded
    existing_admin = await db.users.find_one({"email": "admin@gpgt.ae"})
    if existing_admin:
        return {"message": "Data already seeded"}
    
    # Create admin user
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": "admin@gpgt.ae",
        "password": hash_password("admin123"),
        "name": "Admin User",
        "phone": "+971 4 456 7890",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email_verified": True,  # Admin is pre-verified
        "phone_verified": True,
        "is_active": True
    }
    await db.users.insert_one(admin_doc)
    
    # Create categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Sanitaryware", "name_ar": "أدوات صحية", "icon": "Droplets", "image": "https://images.unsplash.com/photo-1580810734898-5e1753f23337?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Electrical", "name_ar": "كهربائية", "icon": "Zap", "image": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Lightings", "name_ar": "إضاءة", "icon": "Lightbulb", "image": "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Safety", "name_ar": "السلامة", "icon": "Shield", "image": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Tools", "name_ar": "أدوات", "icon": "Wrench", "image": "https://images.unsplash.com/photo-1745449563046-f75d0bd28f46?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Plumbing", "name_ar": "سباكة", "icon": "Pipette", "image": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Paints", "name_ar": "دهانات", "icon": "Paintbrush", "image": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400", "product_count": 0, "is_active": True},
        {"id": str(uuid.uuid4()), "name": "Hardware", "name_ar": "أجهزة", "icon": "Hammer", "image": "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400", "product_count": 0, "is_active": True},
    ]
    
    for cat in categories:
        cat["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.categories.insert_many(categories)
    
    # Create sample products
    products = [
        {"name": "Premium Toilet Set", "name_ar": "مجموعة مراحيض فاخرة", "description": "High-quality ceramic toilet set with soft-close seat", "price": 1299.00, "offer_price": 999.00, "category_id": categories[0]["id"], "sku": "SAN-001", "stock": 50, "images": ["https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400"], "brand": "Grohe", "is_active": True, "is_featured": True},
        {"name": "Electric Wire 2.5mm", "name_ar": "سلك كهربائي 2.5 مم", "description": "High-quality copper wire for electrical installations", "price": 89.00, "category_id": categories[1]["id"], "sku": "ELE-001", "stock": 200, "images": ["https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400"], "brand": "Philips", "is_active": True, "is_featured": False},
        {"name": "LED Panel Light 60W", "name_ar": "لوحة إضاءة LED 60 واط", "description": "Energy-efficient LED panel light for commercial use", "price": 149.00, "offer_price": 119.00, "category_id": categories[2]["id"], "sku": "LIG-001", "stock": 100, "images": ["https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400"], "brand": "Philips", "is_active": True, "is_featured": True},
        {"name": "Safety Helmet", "name_ar": "خوذة أمان", "description": "Industrial safety helmet with adjustable strap", "price": 45.00, "category_id": categories[3]["id"], "sku": "SAF-001", "stock": 300, "images": ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400"], "brand": "3M", "is_active": True, "is_featured": False},
        {"name": "DeWalt Power Drill", "name_ar": "مثقاب ديوالت", "description": "Professional cordless power drill with battery", "price": 599.00, "offer_price": 499.00, "category_id": categories[4]["id"], "sku": "TOO-001", "stock": 75, "images": ["https://images.unsplash.com/photo-1745449563046-f75d0bd28f46?w=400"], "brand": "DeWalt", "is_active": True, "is_featured": True},
        {"name": "PVC Pipe 4 inch", "name_ar": "أنبوب PVC 4 بوصة", "description": "Durable PVC pipe for plumbing installations", "price": 35.00, "category_id": categories[5]["id"], "sku": "PLU-001", "stock": 500, "images": ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400"], "brand": "Wavin", "is_active": True, "is_featured": False},
        {"name": "Interior Wall Paint", "name_ar": "طلاء حائط داخلي", "description": "Premium interior wall paint, 20L bucket", "price": 189.00, "category_id": categories[6]["id"], "sku": "PAI-001", "stock": 150, "images": ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400"], "brand": "Jotun", "is_active": True, "is_featured": True},
        {"name": "Door Lock Set", "name_ar": "مجموعة قفل الباب", "description": "High-security door lock set with keys", "price": 129.00, "offer_price": 99.00, "category_id": categories[7]["id"], "sku": "HAR-001", "stock": 200, "images": ["https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400"], "brand": "Yale", "is_active": True, "is_featured": False},
    ]
    
    for prod in products:
        prod["id"] = str(uuid.uuid4())
        prod["specifications"] = {}
        prod["created_at"] = datetime.now(timezone.utc).isoformat()
        prod["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_many(products)
    
    # Update category product counts
    for cat in categories:
        count = await db.products.count_documents({"category_id": cat["id"]})
        await db.categories.update_one({"id": cat["id"]}, {"$set": {"product_count": count}})
    
    return {"message": "Data seeded successfully", "admin_email": "admin@gpgt.ae", "admin_password": "admin123"}

# ==================== MAIN ====================

@api_router.get("/")
async def root():
    return {"message": "GPGT E-Commerce API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grand-palace.onrender.com",
        "https://grand-palace-backend.onrender.com",
        "http://localhost:3000",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
