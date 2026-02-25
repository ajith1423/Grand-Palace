# ERP-Lite Models for GPGT E-Commerce Platform
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class OrderStatus(str, Enum):
    NEW = "new"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY_TO_SHIP = "ready_to_ship"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    INVOICED = "invoiced"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    UNPAID = "unpaid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class AdminRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ACCOUNTS = "accounts"
    STAFF = "staff"

# ==================== PRODUCT MODELS (Enhanced) ====================

class ProductEnhanced(BaseModel):
    # Existing fields
    name: str
    name_ar: Optional[str] = None
    description: str
    description_ar: Optional[str] = None
    price: float  # This will be selling_price
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
    
    # New ERP fields
    cost_price: Optional[float] = 0.0
    selling_price: Optional[float] = None  # Alias for price
    stock_quantity: Optional[int] = None  # Alias for stock
    reorder_level: int = 10
    supplier_name: Optional[str] = None
    supplier_code: Optional[str] = None

# ==================== ORDER MODELS (Enhanced) ====================

class OrderEnhanced(BaseModel):
    # Financial fields
    order_total: float
    subtotal: float
    tax_amount: float  # VAT
    discount_amount: float = 0.0
    shipping_amount: float
    paid_amount: float = 0.0
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    
    # Status tracking
    status: OrderStatus = OrderStatus.NEW
    status_history: List[Dict[str, Any]] = []

# ==================== INVOICE MODELS ====================

class InvoiceCreate(BaseModel):
    order_id: str
    due_date: Optional[str] = None
    discount: float = 0.0
    notes: Optional[str] = None

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

class Invoice(BaseModel):
    id: str
    invoice_number: str  # Format: INV-0001
    order_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    customer_address: Optional[Dict[str, Any]] = None
    
    invoice_date: str
    due_date: str
    
    items: List[InvoiceItem] = []
    subtotal: float
    tax_rate: float
    tax_amount: float
    discount: float = 0.0
    shipping: float = 0.0
    total_amount: float
    
    payment_status: InvoiceStatus = InvoiceStatus.UNPAID
    paid_amount: float = 0.0
    
    invoice_pdf_url: Optional[str] = None
    
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class InvoiceUpdate(BaseModel):
    due_date: Optional[str] = None
    payment_status: Optional[InvoiceStatus] = None
    paid_amount: Optional[float] = None
    discount: Optional[float] = None
    notes: Optional[str] = None

# ==================== ERP SETTINGS MODELS ====================

class ERPSettings(BaseModel):
    # Company Info
    company_name: str = "Grand Palace General Trading"
    company_address: str = "Dubai, UAE"
    company_phone: str = "+971 4 456 7890"
    company_email: str = "info@gpgt.ae"
    company_trn: str = ""  # VAT TRN (UAE)
    company_logo: Optional[str] = None  # Logo URL
    
    # Invoice Settings
    invoice_prefix: str = "INV-"
    invoice_starting_number: int = 1
    currency: str = "AED"
    currency_symbol: str = "AED"
    
    # Tax Settings
    vat_percentage: float = 5.0
    vat_trn: str = ""  # Placeholder
    
    # Payment Settings
    payment_enabled: bool = True
    cod_enabled: bool = True
    payment_methods: List[str] = ["card", "cod", "bank_transfer"]
    
    # Invoice Template Customization
    invoice_columns: List[Dict[str, Any]] = [
        {"key": "item", "label": "Item Description", "visible": True},
        {"key": "quantity", "label": "Qty", "visible": True},
        {"key": "unit_price", "label": "Unit Price", "visible": True},
        {"key": "total", "label": "Total", "visible": True}
    ]
    invoice_footer_text: str = "Thank you for your business!"
    invoice_terms: str = "Payment due within 30 days."
    show_bank_details: bool = False
    bank_details: Optional[Dict[str, str]] = None

# ==================== CUSTOMER ERP VIEW MODELS ====================

class CustomerERPView(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    
    # Order stats
    total_orders: int = 0
    total_purchase_value: float = 0.0
    total_paid_amount: float = 0.0
    outstanding_balance: float = 0.0
    last_order_date: Optional[str] = None
    
    # Verification status
    email_verified: bool = False
    phone_verified: bool = False
    
    # Account status
    is_active: bool = True
    created_at: str

# ==================== REPORT MODELS ====================

class ReportFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    report_type: str  # sales, invoice, payments, products, customers, stock

class SalesReportItem(BaseModel):
    date: str
    order_count: int
    total_revenue: float
    total_paid: float
    total_unpaid: float

class ProductReportItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity_sold: int
    revenue: float

class CustomerReportItem(BaseModel):
    customer_id: str
    customer_name: str
    email: str
    total_orders: int
    total_spent: float
    outstanding: float

# ==================== DASHBOARD KPI MODELS ====================

class DashboardKPIs(BaseModel):
    # Order KPIs
    total_orders: int = 0
    pending_orders: int = 0
    completed_orders: int = 0
    cancelled_orders: int = 0
    
    # Financial KPIs
    total_revenue: float = 0.0
    paid_amount: float = 0.0
    unpaid_amount: float = 0.0
    
    # Product KPIs
    total_products: int = 0
    low_stock_products: int = 0
    out_of_stock_products: int = 0
    total_stock_value: float = 0.0
    
    # Customer KPIs
    total_customers: int = 0
    new_customers_30_days: int = 0
    verified_customers: int = 0
    
    # Invoice KPIs
    total_invoices: int = 0
    unpaid_invoices: int = 0
    overdue_invoices: int = 0
    
    # Charts data
    monthly_revenue: List[Dict[str, Any]] = []
    order_status_distribution: List[Dict[str, Any]] = []

# ==================== ADMIN ROLE PERMISSIONS ====================

ROLE_PERMISSIONS = {
    AdminRole.ADMIN: ["all"],
    AdminRole.MANAGER: ["orders", "products", "categories", "customers"],
    AdminRole.ACCOUNTS: ["invoices", "payments", "reports", "customers"],
    AdminRole.STAFF: ["orders:view", "products:view", "customers:view"]
}
