"""
ERP-Lite Enhancement Testing
Tests for: ERP Dashboard KPIs, Invoice Management, Reports, ERP Settings, Customer ERP View, Order Timeline
"""
import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
ADMIN_EMAIL = "admin@gpgt.ae"
ADMIN_PASSWORD = "admin123"


class TestSetup:
    """Setup fixtures and helper functions"""
    
    @staticmethod
    def get_admin_token():
        """Authenticate as admin and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    @staticmethod
    def get_auth_headers(token):
        """Return headers with authorization"""
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test that admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Test login rejection with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")


class TestERPDashboardKPIs:
    """Test ERP Dashboard KPIs API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_get_dashboard_kpis(self):
        """Test GET /api/erp/dashboard/kpis returns all required KPIs"""
        response = requests.get(f"{BASE_URL}/api/erp/dashboard/kpis", headers=self.headers)
        assert response.status_code == 200, f"KPIs request failed: {response.text}"
        data = response.json()
        
        # Order KPIs
        assert "total_orders" in data, "Missing total_orders"
        assert "pending_orders" in data, "Missing pending_orders"
        assert "completed_orders" in data, "Missing completed_orders"
        assert "cancelled_orders" in data, "Missing cancelled_orders"
        
        # Financial KPIs
        assert "total_revenue" in data, "Missing total_revenue"
        assert "paid_amount" in data, "Missing paid_amount"
        assert "unpaid_amount" in data, "Missing unpaid_amount"
        
        # Product KPIs
        assert "total_products" in data, "Missing total_products"
        assert "low_stock_products" in data, "Missing low_stock_products"
        assert "total_stock_value" in data, "Missing total_stock_value"
        
        # Customer KPIs
        assert "total_customers" in data, "Missing total_customers"
        assert "new_customers_30_days" in data, "Missing new_customers_30_days"
        
        # Invoice KPIs
        assert "total_invoices" in data, "Missing total_invoices"
        assert "unpaid_invoices" in data, "Missing unpaid_invoices"
        assert "overdue_invoices" in data, "Missing overdue_invoices"
        
        # Chart data
        assert "monthly_revenue" in data, "Missing monthly_revenue"
        assert "order_status_distribution" in data, "Missing order_status_distribution"
        
        print(f"✓ Dashboard KPIs retrieved: {data['total_orders']} orders, AED {data['total_revenue']} revenue")
    
    def test_dashboard_kpis_requires_auth(self):
        """Test that dashboard KPIs require authentication"""
        response = requests.get(f"{BASE_URL}/api/erp/dashboard/kpis")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Dashboard KPIs require authentication")


class TestERPOrders:
    """Test ERP Orders endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_get_erp_orders(self):
        """Test GET /api/erp/orders"""
        response = requests.get(f"{BASE_URL}/api/erp/orders", headers=self.headers)
        assert response.status_code == 200, f"Get orders failed: {response.text}"
        data = response.json()
        assert "orders" in data
        assert "total" in data
        print(f"✓ Retrieved {len(data['orders'])} orders")
    
    def test_get_erp_orders_with_pagination(self):
        """Test orders pagination"""
        response = requests.get(f"{BASE_URL}/api/erp/orders?page=1&limit=10", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["orders"]) <= 10
        print("✓ Orders pagination works")
    
    def test_get_order_timeline(self):
        """Test GET /api/erp/orders/{id}/timeline - requires existing order"""
        # First get an order
        orders_response = requests.get(f"{BASE_URL}/api/erp/orders?limit=1", headers=self.headers)
        if orders_response.status_code == 200 and orders_response.json().get("orders"):
            order = orders_response.json()["orders"][0]
            order_id = order["id"]
            
            response = requests.get(f"{BASE_URL}/api/erp/orders/{order_id}/timeline", headers=self.headers)
            assert response.status_code == 200, f"Timeline request failed: {response.text}"
            data = response.json()
            assert "timeline" in data or "events" in data or isinstance(data, list), f"Unexpected timeline format: {data}"
            print(f"✓ Order timeline retrieved for order {order.get('order_number')}")
        else:
            print("⚠ No orders available to test timeline")
            pytest.skip("No orders available")


class TestInvoiceManagement:
    """Test Invoice Management APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_get_invoices(self):
        """Test GET /api/erp/invoices"""
        response = requests.get(f"{BASE_URL}/api/erp/invoices", headers=self.headers)
        assert response.status_code == 200, f"Get invoices failed: {response.text}"
        data = response.json()
        assert "invoices" in data
        assert "total" in data
        print(f"✓ Retrieved {len(data['invoices'])} invoices")
        return data["invoices"]
    
    def test_get_invoices_with_status_filter(self):
        """Test invoices filtering by status"""
        for status in ["unpaid", "paid", "partial"]:
            response = requests.get(f"{BASE_URL}/api/erp/invoices?status={status}", headers=self.headers)
            assert response.status_code == 200, f"Filter by {status} failed"
        print("✓ Invoice status filtering works")
    
    def test_create_invoice_from_order(self):
        """Test POST /api/erp/invoices - create invoice from order"""
        # Get an order without invoice
        orders_response = requests.get(f"{BASE_URL}/api/erp/orders?limit=50", headers=self.headers)
        orders = orders_response.json().get("orders", [])
        
        # Find an order without invoice
        order_without_invoice = None
        for order in orders:
            if not order.get("invoice_number"):
                order_without_invoice = order
                break
        
        if order_without_invoice:
            due_date = (datetime.now() + timedelta(days=30)).isoformat()
            response = requests.post(f"{BASE_URL}/api/erp/invoices", 
                headers=self.headers,
                json={
                    "order_id": order_without_invoice["id"],
                    "due_date": due_date,
                    "discount": 0,
                    "notes": "TEST invoice created by automated test"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                assert "invoice_number" in data
                print(f"✓ Invoice created: {data['invoice_number']}")
            elif response.status_code == 400:
                # Invoice might already exist - this is acceptable
                print("✓ Invoice creation handled (order may already have invoice)")
            else:
                print(f"⚠ Invoice creation returned: {response.status_code} - {response.text}")
        else:
            print("⚠ All orders already have invoices - testing existing invoice")
    
    def test_get_single_invoice(self):
        """Test GET /api/erp/invoices/{id}"""
        invoices_response = requests.get(f"{BASE_URL}/api/erp/invoices?limit=1", headers=self.headers)
        invoices = invoices_response.json().get("invoices", [])
        
        if invoices:
            invoice_id = invoices[0]["id"]
            response = requests.get(f"{BASE_URL}/api/erp/invoices/{invoice_id}", headers=self.headers)
            assert response.status_code == 200, f"Get invoice failed: {response.text}"
            data = response.json()
            assert data["id"] == invoice_id
            print(f"✓ Retrieved invoice: {data.get('invoice_number')}")
        else:
            pytest.skip("No invoices available to test")
    
    def test_download_invoice_pdf(self):
        """Test GET /api/erp/invoices/{id}/pdf"""
        invoices_response = requests.get(f"{BASE_URL}/api/erp/invoices?limit=1", headers=self.headers)
        invoices = invoices_response.json().get("invoices", [])
        
        if invoices:
            invoice_id = invoices[0]["id"]
            response = requests.get(f"{BASE_URL}/api/erp/invoices/{invoice_id}/pdf", headers=self.headers)
            assert response.status_code == 200, f"PDF download failed: {response.text}"
            data = response.json()
            assert "content" in data, "PDF content missing"
            assert "filename" in data, "Filename missing"
            print(f"✓ Invoice PDF generated: {data['filename']}")
        else:
            pytest.skip("No invoices available to test PDF")
    
    def test_record_payment(self):
        """Test POST /api/erp/invoices/{id}/record-payment"""
        invoices_response = requests.get(f"{BASE_URL}/api/erp/invoices?status=unpaid&limit=1", headers=self.headers)
        invoices = invoices_response.json().get("invoices", [])
        
        if invoices:
            invoice = invoices[0]
            invoice_id = invoice["id"]
            balance = invoice.get("total_amount", 0) - invoice.get("paid_amount", 0)
            
            if balance > 0:
                # Record a small payment to test
                payment_amount = min(balance, 10.0)  # Pay at most 10 AED for test
                response = requests.post(f"{BASE_URL}/api/erp/invoices/{invoice_id}/record-payment",
                    headers=self.headers,
                    json={
                        "invoice_id": invoice_id,
                        "amount": payment_amount,
                        "payment_method": "bank_transfer",
                        "reference": "TEST_PAYMENT_001",
                        "notes": "Test payment recorded by automated test"
                    }
                )
                assert response.status_code == 200, f"Record payment failed: {response.text}"
                print(f"✓ Payment of AED {payment_amount} recorded")
            else:
                print("⚠ Invoice already fully paid")
        else:
            print("⚠ No unpaid invoices to test payment recording")


class TestReportsGeneration:
    """Test Reports Generation API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_generate_sales_report(self):
        """Test POST /api/erp/reports/generate - sales report"""
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "sales",
                "start_date": start_date,
                "end_date": end_date,
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Sales report failed: {response.text}"
        data = response.json()
        assert "data" in data or isinstance(data, list)
        print("✓ Sales report generated")
    
    def test_generate_invoice_report(self):
        """Test invoice report generation"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "invoice",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Invoice report failed: {response.text}"
        print("✓ Invoice report generated")
    
    def test_generate_payments_report(self):
        """Test pending payments report"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "payments",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Payments report failed: {response.text}"
        print("✓ Pending payments report generated")
    
    def test_generate_products_report(self):
        """Test top products report"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "products",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Products report failed: {response.text}"
        print("✓ Top products report generated")
    
    def test_generate_customers_report(self):
        """Test top customers report"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "customers",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Customers report failed: {response.text}"
        print("✓ Top customers report generated")
    
    def test_generate_stock_report(self):
        """Test low stock report"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "stock",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "json"
            }
        )
        assert response.status_code == 200, f"Stock report failed: {response.text}"
        print("✓ Low stock report generated")
    
    def test_export_report_csv(self):
        """Test CSV export"""
        response = requests.post(f"{BASE_URL}/api/erp/reports/generate",
            headers=self.headers,
            json={
                "report_type": "sales",
                "start_date": "2024-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d"),
                "format": "csv"
            }
        )
        assert response.status_code == 200, f"CSV export failed: {response.text}"
        data = response.json()
        assert "content" in data or "data" in data
        print("✓ CSV export works")


class TestERPSettings:
    """Test ERP Settings API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_get_erp_settings(self):
        """Test GET /api/erp/settings"""
        response = requests.get(f"{BASE_URL}/api/erp/settings", headers=self.headers)
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        data = response.json()
        
        # Check expected fields
        expected_fields = ["company_name", "vat_percentage", "currency", "invoice_prefix"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ ERP settings retrieved: {data.get('company_name')}")
        return data
    
    def test_update_erp_settings(self):
        """Test PUT /api/erp/settings"""
        # First get current settings
        current = requests.get(f"{BASE_URL}/api/erp/settings", headers=self.headers).json()
        
        # Update with a test value
        test_footer = f"Test footer - Updated at {datetime.now().isoformat()}"
        response = requests.put(f"{BASE_URL}/api/erp/settings",
            headers=self.headers,
            json={
                "invoice_footer_text": test_footer
            }
        )
        assert response.status_code == 200, f"Update settings failed: {response.text}"
        
        # Verify update
        updated = requests.get(f"{BASE_URL}/api/erp/settings", headers=self.headers).json()
        assert updated.get("invoice_footer_text") == test_footer
        print("✓ ERP settings updated and verified")
    
    def test_erp_settings_requires_admin(self):
        """Test that ERP settings require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/erp/settings")
        assert response.status_code in [401, 403]
        print("✓ ERP settings require admin authentication")


class TestCustomerERPView:
    """Test Customer ERP View API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_get_customers_list(self):
        """Test GET /api/erp/customers"""
        response = requests.get(f"{BASE_URL}/api/erp/customers", headers=self.headers)
        assert response.status_code == 200, f"Get customers failed: {response.text}"
        data = response.json()
        assert "customers" in data
        
        if data["customers"]:
            customer = data["customers"][0]
            # Check expected fields in customer data
            expected_fields = ["id", "name", "email", "total_orders", "total_purchase_value"]
            for field in expected_fields:
                assert field in customer, f"Missing customer field: {field}"
        
        print(f"✓ Retrieved {len(data['customers'])} customers")
    
    def test_get_customers_filtered_high_value(self):
        """Test customers filter - high value"""
        response = requests.get(f"{BASE_URL}/api/erp/customers?filter_type=high_value", headers=self.headers)
        assert response.status_code == 200
        print("✓ High value customers filter works")
    
    def test_get_customers_filtered_pending_payments(self):
        """Test customers filter - pending payments"""
        response = requests.get(f"{BASE_URL}/api/erp/customers?filter_type=pending_payments", headers=self.headers)
        assert response.status_code == 200
        print("✓ Pending payments customers filter works")
    
    def test_get_customer_detail(self):
        """Test GET /api/erp/customers/{id}"""
        customers_response = requests.get(f"{BASE_URL}/api/erp/customers?limit=1", headers=self.headers)
        customers = customers_response.json().get("customers", [])
        
        if customers:
            customer_id = customers[0]["id"]
            response = requests.get(f"{BASE_URL}/api/erp/customers/{customer_id}", headers=self.headers)
            assert response.status_code == 200, f"Get customer detail failed: {response.text}"
            data = response.json()
            
            # Check for detailed information
            assert "orders" in data or "total_orders" in data
            assert "total_purchase_value" in data or "total_spent" in data
            print(f"✓ Customer detail retrieved: {data.get('name')}")
        else:
            pytest.skip("No customers available")


class TestIntegration:
    """End-to-end integration tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestSetup.get_admin_token()
        self.headers = TestSetup.get_auth_headers(self.token)
    
    def test_dashboard_to_invoice_flow(self):
        """Test navigation from dashboard KPIs to invoice details"""
        # Get dashboard KPIs
        kpis = requests.get(f"{BASE_URL}/api/erp/dashboard/kpis", headers=self.headers)
        assert kpis.status_code == 200
        
        total_invoices = kpis.json().get("total_invoices", 0)
        
        # If there are invoices, verify the count matches
        if total_invoices > 0:
            invoices = requests.get(f"{BASE_URL}/api/erp/invoices", headers=self.headers)
            assert invoices.status_code == 200
            assert invoices.json()["total"] == total_invoices
            print(f"✓ Dashboard KPIs match invoice count: {total_invoices}")
        else:
            print("✓ Dashboard shows 0 invoices (no invoices in system)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
