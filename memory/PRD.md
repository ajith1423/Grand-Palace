# GPGT E-Commerce Platform - Product Requirements Document

## Project Overview
Grand Palace General Trading (GPGT) - A comprehensive B2B/B2C e-commerce platform with ERP-Lite administrative capabilities for the UAE market.

**Latest Update (Feb 2026)**: Complete Admin Panel redesign with elegant vertical sidebar navigation and ERP-Lite dashboard.

---

## Original Problem Statement
Build a high-conversion e-commerce site with:
- Mega menu navigation
- Cart-to-enquiry flow for lead generation
- User account management
- Email OTP verification
- Responsive design across all devices
- **NEW: ERP-Lite Admin Panel Enhancement** with dashboard KPIs, invoice management, reports, and more

---

## Core Requirements

### 1. Frontend E-Commerce Features ✅
- Product catalog with categories
- Mega menu navigation
- Shopping cart functionality
- Checkout flow (COD/Card payment)
- User registration/login
- User account dashboard
- Email OTP verification for new users

### 2. Admin Panel Features ✅
- Product management (CRUD)
- Category management
- Order management
- Customer management
- Settings management
- User verification controls

### 3. ERP-Lite Enhancement (NEW) ✅
#### Dashboard KPIs
- Total/Pending/Completed/Cancelled Orders
- Total Revenue / Paid / Outstanding Amount
- Total Products / Low Stock Alerts
- Total Customers / New (30 days)
- Monthly Revenue Bar Chart
- Order Status Distribution Pie Chart

#### Invoice Management
- Create invoice from order (auto INV-0001 format)
- Invoice PDF generation with company branding
- Customizable invoice columns
- Email invoice to customer
- Record payments against invoices
- Track payment status (Paid/Partial/Unpaid/Overdue)

#### Reports Module
- Sales Report (Daily/Monthly)
- Invoice Report
- Pending Payments Report
- Top Products Report
- Top Customers Report
- Low Stock Report
- CSV/PDF Export

#### ERP Settings
- Company Info (name, address, phone, email, TRN)
- Company logo upload
- Invoice customization (prefix, columns, footer, terms)
- Payment method settings
- Bank details for wire transfers

#### Customer ERP View
- Customer list with financial stats
- Total orders, purchase value, paid amount
- Outstanding balance tracking
- Filters: High-value customers, Pending payments
- Customer detail modal with order/invoice history

---

## Technical Architecture

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **State Management**: React Context
- **Routing**: React Router v6

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT tokens
- **PDF Generation**: ReportLab
- **Email**: SendGrid API

### Database Collections
- `users` - Customer and admin accounts
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order records
- `invoices` - Invoice records (NEW)
- `settings` - Global settings
- `carts` - Shopping carts

---

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`

### ERP Dashboard
- `GET /api/erp/dashboard/kpis`

### Invoice Management
- `GET /api/erp/invoices`
- `POST /api/erp/invoices`
- `GET /api/erp/invoices/{id}`
- `PUT /api/erp/invoices/{id}`
- `GET /api/erp/invoices/{id}/pdf`
- `POST /api/erp/invoices/{id}/record-payment`
- `POST /api/erp/invoices/{id}/send-email`

### Reports
- `POST /api/erp/reports/generate`

### ERP Settings
- `GET /api/erp/settings`
- `PUT /api/erp/settings`

### Customer ERP View
- `GET /api/erp/customers`
- `GET /api/erp/customers/{id}`

### Order Management
- `GET /api/erp/orders`
- `PUT /api/erp/orders/{id}/status`
- `GET /api/erp/orders/{id}/timeline`

---

## What's Been Implemented

### February 2026

#### Admin Panel UI Redesign (Latest)
- **Vertical Sidebar Navigation** - Elegant collapsible sidebar with sections
  - Shop Management: Orders, Products, Categories
  - ERP / Finance: Invoices, Reports, Customers
  - Settings: General, ERP Settings
- **Responsive design** for desktop and mobile
- **User profile** with logout in sidebar footer
- **Clean header** with search and notifications

#### ERP-Lite Admin Enhancement
- **ERP Dashboard** (`/admin`) - Replaced basic admin with KPI-rich dashboard
- **Invoice Management** (`/admin/erp/invoices`) - Full invoice lifecycle
- **Reports Module** (`/admin/erp/reports`) - 6 report types with export
- **ERP Settings** (`/admin/erp/settings`) - Company/invoice/payment config
- **Customer ERP View** (`/admin/erp/customers`) - Customer financial analytics

#### Backend APIs
- All ERP endpoints implemented in `server.py`
- Invoice PDF generation with ReportLab
- Report generation with date range filtering
- CSV export functionality

### Previous Implementations
- Email OTP verification system
- Responsive design optimization
- User account dashboard
- Cart-to-enquiry flow
- Checkout bug fixes

---

## Test Credentials
- **Admin**: `admin@gpgt.ae` / `admin123`
- **Test Customer**: `testcustomer@test.com` / `test123`

---

## Testing Status
- Backend API Tests: 28/28 PASSED
- Frontend UI Tests: 26/26 PASSED
- Invoice PDF Generation: VERIFIED
- Reports Export: VERIFIED

---

## Known Limitations
- Email sending requires SendGrid API key configuration

---

## What's Been Implemented

### December 2025 - Session 4: Product Reviews & Ratings System
- **Review System**:
  - Customers can leave reviews with 1-5 star ratings
  - Review title and detailed comment support
  - "Verified Purchase" badge for customers who bought the product
  - Helpful count for community feedback
- **Rating Display**:
  - Star ratings on product cards (when reviews exist)
  - Average rating and review count on product detail
  - Rating breakdown (5-star, 4-star bars, etc.)
- **Reviews Tab** on product detail page:
  - Rating summary with large rating display
  - Review list with pagination
  - Review form for logged-in users
  - Login prompt for guests

### December 2025 - Session 3: Remaining Features Completed
- **Google OAuth via Emergent**:
  - "Continue with Google" button on login/register pages
  - Redirects to auth.emergentagent.com for Google authentication
  - AuthCallback page handles session_id exchange via POST /api/auth/emergent/session
  - Creates new user or logs in existing user by email
- **Address Management**:
  - Add/Edit/Delete addresses in user account
  - Set default address
  - Address labels (Home/Office/Other)
  - Full address details with emirates selection
- **Product Multiple Images**:
  - Products can have multiple images
  - Thumbnail gallery in product detail page
  - Main image selection on click

### December 2025 - Session 2: UI Enhancements & Notifications
- **Cart Text Label** - "Cart" text visible next to cart icon in header
- **Admin Notifications System**:
  - Bell icon with unread count badge in admin header
  - Dropdown showing notifications (new users, orders, enquiries)
  - Mark as read / Mark all read functionality
  - Real-time polling every 30 seconds
- **Quotation Mode Active Banner** - Shows on admin dashboard when prices are hidden
- **Checkout Form Enhancements**:
  - Default +971 prefix for mobile number
  - All required fields marked with asterisks

### December 2025 - Session 1: Quotation Model (Price Hide/Show Toggle)
- **Storefront Settings Tab** in ERP Settings with:
  - "Show Prices on Website" toggle
  - WhatsApp Business Number configuration
- **Quotation Mode** when prices hidden:
  - Product cards show "Request Quote" instead of prices
  - Product detail page shows "Request Quote for Pricing"
  - Cart becomes "Inquiry List" with "Request Quotation" button
  - Checkout becomes quotation request flow
- **Login Text Label** - "Login" text now visible next to login icon in header

---

## Backlog / Future Tasks

### P1 (Medium Priority)
- Refactor App.js to extract page components

### P2 (Low Priority)
- SMS OTP verification
- Advanced inventory tracking
- Multi-warehouse support
- Low stock notifications

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/emergent/session` - Exchange Emergent OAuth session_id for token
- `GET /api/auth/me` - Get current user

### Notifications
- `GET /api/notifications` - Get admin notifications (with unread_count)
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/{id}` - Delete a notification

### Product Reviews
- `POST /api/products/{id}/reviews` - Create review (requires auth)
- `GET /api/products/{id}/reviews` - Get reviews with pagination
- `PUT /api/reviews/{id}/helpful` - Mark review as helpful
- `DELETE /api/reviews/{id}` - Delete review (admin only)

### User Management
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/addresses` - Update user addresses (CRUD)

---

## File Structure
```
/app
├── backend/
│   ├── server.py          # Main FastAPI application with ERP routes
│   ├── models.py          # Pydantic models for ERP
│   ├── erp_routes.py      # (unused - merged into server.py)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.js
│       ├── context/AppContext.js
│       ├── pages/
│       │   ├── ERPDashboard.js      # NEW
│       │   ├── InvoiceManagement.js  # NEW
│       │   ├── ReportsModule.js      # NEW
│       │   ├── ERPSettings.js        # NEW (with Storefront tab)
│       │   ├── CustomerERPView.js    # NEW
│       │   ├── Admin.js
│       │   ├── AccountPage.js
│       │   └── ...
│       └── components/
│           ├── layout/Header.js      # Updated with Login text
│           ├── ProductCard.js        # Updated with quotation mode
│           └── ...
└── memory/
    └── PRD.md
```

---

## Version History
- v1.0 - Initial e-commerce platform
- v1.1 - Email OTP verification
- v1.2 - Responsive design optimization
- v1.3 - User account dashboard
- v2.0 - ERP-Lite Admin Enhancement
- v2.1 - Quotation Model (Price Hide/Show Toggle)
- v2.2 - Admin Notifications & UI Enhancements
- v2.3 - Google OAuth & Feature Completion
- v2.4 - Product Reviews & Ratings System
- **v2.5 - Real Product Data & Enhanced Image Management** (Current)

---

## Session Updates

### February 2026 - Session 5: Real Product Data Import
- **Real Products Added (24 products)**:
  - Sanitaryware: 10 products (WC, Basin, Urinal, Showers, Water Heater, Bathtub, etc.)
  - Electrical: 6 products (Cables, Wire, Conduits, Switches, Sockets, Isolators)
  - Hardware: 4 products (Door Handle, Lock, Chain Block, Screwdriver Kit)
  - Prefab Cabins: 4 products (Portable Toilet, Site Office, Porta Cabin, Security Cabin)
- **Enhanced Multiple Image Upload in Admin Panel**:
  - Drag & drop zone for image uploads
  - Upload multiple images at once (up to 10)
  - Image reordering (set main image)
  - Image preview grid with "Main" badge
  - Add images via URL
  - Move/delete controls on hover
- **Script Created**: `/app/backend/scripts/add_real_products.py` for bulk product import
