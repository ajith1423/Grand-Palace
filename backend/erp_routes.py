# ERP-Lite Routes for GPGT E-Commerce Platform
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import uuid
import os
from io import BytesIO
import base64

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from pydantic import BaseModel

# Router
erp_router = APIRouter(prefix="/api/erp", tags=["ERP"])

# ==================== PYDANTIC MODELS ====================

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

class ReportRequest(BaseModel):
    report_type: str  # sales, invoice, payments, products, customers, stock
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = "json"  # json, csv, pdf

# ==================== HELPER FUNCTIONS ====================

def get_db():
    """Get database reference - will be set from main server"""
    from server import db
    return db

def get_settings_func():
    """Get settings function - will be set from main server"""
    from server import get_settings
    return get_settings

def get_require_admin():
    """Get require_admin dependency - will be set from main server"""
    from server import require_admin
    return require_admin

async def get_next_invoice_number(db) -> str:
    """Generate next invoice number in format INV-0001"""
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    prefix = settings.get("invoice_prefix", "INV-") if settings else "INV-"
    
    # Get the last invoice number
    last_invoice = await db.invoices.find_one(
        {}, 
        {"invoice_number": 1, "_id": 0},
        sort=[("created_at", -1)]
    )
    
    if last_invoice and last_invoice.get("invoice_number"):
        try:
            # Extract number from INV-0001 format
            num_str = last_invoice["invoice_number"].replace(prefix, "")
            next_num = int(num_str) + 1
        except:
            next_num = 1
    else:
        starting_num = settings.get("invoice_starting_number", 1) if settings else 1
        next_num = starting_num
    
    return f"{prefix}{str(next_num).zfill(4)}"

async def generate_erp_invoice_pdf(invoice: dict, settings: dict) -> bytes:
    """Generate professional invoice PDF with company logo"""
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
    
    # Header with company logo
    company_name = settings.get('company_name', 'Grand Palace General Trading')
    company_address = settings.get('company_address', 'Dubai, UAE')
    company_phone = settings.get('company_phone', '+971 4 456 7890')
    company_email = settings.get('company_email', 'info@gpgt.ae')
    company_trn = settings.get('company_trn', '') or settings.get('vat_trn', '')
    
    # Company header
    elements.append(Paragraph(company_name, title_style))
    elements.append(Paragraph(f"{company_address} | Tel: {company_phone} | Email: {company_email}", company_style))
    if company_trn:
        elements.append(Paragraph(f"TRN: {company_trn}", company_style))
    elements.append(Spacer(1, 20))
    
    # Invoice title and number
    elements.append(Paragraph("TAX INVOICE", invoice_title))
    elements.append(Spacer(1, 10))
    
    # Invoice details grid
    invoice_info = [
        ["Invoice Number:", invoice.get('invoice_number', ''), "Invoice Date:", invoice.get('invoice_date', '')[:10]],
        ["Order Number:", invoice.get('order_number', ''), "Due Date:", invoice.get('due_date', '')[:10] if invoice.get('due_date') else 'On Receipt'],
        ["Status:", invoice.get('payment_status', 'UNPAID').upper(), "", ""]
    ]
    info_table = Table(invoice_info, colWidths=[90, 150, 90, 150])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#d4af37') if invoice.get('payment_status') == 'paid' else colors.HexColor('#dc3545')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Bill To section
    elements.append(Paragraph("Bill To:", header_style))
    customer_info = f"""
    <b>{invoice.get('customer_name', '')}</b><br/>
    {invoice.get('customer_address', {}).get('address_line1', '') if invoice.get('customer_address') else ''}<br/>
    {invoice.get('customer_address', {}).get('city', '')}, {invoice.get('customer_address', {}).get('emirate', '')} if invoice.get('customer_address') else ''<br/>
    Phone: {invoice.get('customer_phone', '')}<br/>
    Email: {invoice.get('customer_email', '')}
    """
    elements.append(Paragraph(customer_info, normal_style))
    elements.append(Spacer(1, 20))
    
    # Items table
    elements.append(Paragraph("Invoice Items:", header_style))
    
    # Get visible columns from settings
    invoice_columns = settings.get('invoice_columns', [
        {"key": "item", "label": "Item Description", "visible": True},
        {"key": "quantity", "label": "Qty", "visible": True},
        {"key": "unit_price", "label": "Unit Price", "visible": True},
        {"key": "total", "label": "Total", "visible": True}
    ])
    
    # Build header row
    header_row = ["#"]
    for col in invoice_columns:
        if col.get("visible", True):
            header_row.append(col.get("label", col.get("key", "")))
    
    items_data = [header_row]
    
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
                    row.append(f"AED {item.get('unit_price', 0):.2f}")
                elif key == "total":
                    row.append(f"AED {item.get('total', item.get('total_price', 0)):.2f}")
                else:
                    row.append(str(item.get(key, '')))
        items_data.append(row)
    
    # Calculate column widths
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
    currency = settings.get('currency', 'AED')
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
        totals_data.append(["Balance Due:", f"{currency} {(invoice.get('total_amount', 0) - invoice.get('paid_amount', 0)):.2f}"])
    
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
    
    # Bank details if enabled
    if settings.get('show_bank_details') and settings.get('bank_details'):
        bank = settings['bank_details']
        elements.append(Paragraph("Bank Details:", header_style))
        bank_info = f"""
        Bank: {bank.get('bank_name', '')}<br/>
        Account Name: {bank.get('account_name', '')}<br/>
        Account Number: {bank.get('account_number', '')}<br/>
        IBAN: {bank.get('iban', '')}<br/>
        Swift Code: {bank.get('swift_code', '')}
        """
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
