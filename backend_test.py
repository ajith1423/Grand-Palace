#!/usr/bin/env python3
"""
GPGT E-Commerce Backend API Testing Suite
Tests all backend functionality including auth, products, cart, orders, admin features
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class GPGTAPITester:
    def __init__(self, base_url: str = "https://quote-catalog-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.customer_token = None
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.admin_credentials = {"email": "admin@gpgt.ae", "password": "admin123"}
        self.test_customer = {
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "phone": "+971501234567"
        }

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, params: Dict = None) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response data, status code"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        request_headers = {'Content-Type': 'application/json'}
        if headers:
            request_headers.update(headers)
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=request_headers, params=params, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=request_headers, params=params, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, params=params, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=request_headers, params=params, timeout=30)
            else:
                return False, {"error": "Unsupported method"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def get_auth_headers(self, token: str) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}

    def test_api_root(self):
        """Test API root endpoint"""
        success, data, status = self.make_request('GET', '/')
        expected_message = "GPGT E-Commerce API"
        if success and expected_message in str(data.get('message', '')):
            self.log_test("API Root Endpoint", True)
            return True
        else:
            self.log_test("API Root Endpoint", False, f"Status: {status}, Data: {data}")
            return False

    def test_seed_data(self):
        """Test seeding initial data"""
        success, data, status = self.make_request('POST', '/seed')
        if success or status == 200:
            self.log_test("Seed Data", True, "Data seeded or already exists")
            return True
        else:
            self.log_test("Seed Data", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_login(self):
        """Test admin login"""
        success, data, status = self.make_request('POST', '/auth/login', self.admin_credentials)
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_customer_registration(self):
        """Test customer registration"""
        success, data, status = self.make_request('POST', '/auth/register', self.test_customer)
        if success and 'token' in data:
            self.customer_token = data['token']
            self.log_test("Customer Registration", True)
            return True
        else:
            self.log_test("Customer Registration", False, f"Status: {status}, Data: {data}")
            return False

    def test_customer_login(self):
        """Test customer login"""
        login_data = {"email": self.test_customer["email"], "password": self.test_customer["password"]}
        success, data, status = self.make_request('POST', '/auth/login', login_data)
        if success and 'token' in data:
            self.customer_token = data['token']
            self.log_test("Customer Login", True)
            return True
        else:
            self.log_test("Customer Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_categories(self):
        """Test getting categories"""
        success, data, status = self.make_request('GET', '/categories')
        if success and isinstance(data, list) and len(data) > 0:
            self.categories = data
            self.log_test("Get Categories", True, f"Found {len(data)} categories")
            return True
        else:
            self.log_test("Get Categories", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_products(self):
        """Test getting products"""
        success, data, status = self.make_request('GET', '/products')
        if success and 'products' in data and len(data['products']) > 0:
            self.products = data['products']
            self.log_test("Get Products", True, f"Found {len(data['products'])} products")
            return True
        else:
            self.log_test("Get Products", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_product_detail(self):
        """Test getting product detail"""
        if not hasattr(self, 'products') or not self.products:
            self.log_test("Get Product Detail", False, "No products available")
            return False
        
        product_id = self.products[0]['id']
        success, data, status = self.make_request('GET', f'/products/{product_id}')
        if success and data.get('id') == product_id:
            self.log_test("Get Product Detail", True)
            return True
        else:
            self.log_test("Get Product Detail", False, f"Status: {status}, Data: {data}")
            return False

    def test_add_to_cart(self):
        """Test adding product to cart"""
        if not hasattr(self, 'products') or not self.products:
            self.log_test("Add to Cart", False, "No products available")
            return False
        
        product_id = self.products[0]['id']
        cart_data = {"product_id": product_id, "quantity": 2}
        
        # Test without authentication (guest cart)
        success, data, status = self.make_request('POST', '/cart/add', cart_data)
        if success:
            if 'session_id' in data:
                self.session_id = data['session_id']
            self.log_test("Add to Cart (Guest)", True)
        else:
            self.log_test("Add to Cart (Guest)", False, f"Status: {status}, Data: {data}")
            return False
        
        # Test with authentication
        if self.customer_token:
            headers = self.get_auth_headers(self.customer_token)
            success, data, status = self.make_request('POST', '/cart/add', cart_data, headers)
            if success:
                self.log_test("Add to Cart (Authenticated)", True)
                return True
            else:
                self.log_test("Add to Cart (Authenticated)", False, f"Status: {status}, Data: {data}")
                return False
        
        return True

    def test_get_cart(self):
        """Test getting cart contents"""
        # Test guest cart
        params = {"session_id": self.session_id} if self.session_id else {}
        success, data, status = self.make_request('GET', '/cart', params=params)
        if success and 'items' in data:
            self.log_test("Get Cart (Guest)", True, f"Cart has {len(data['items'])} items")
        else:
            self.log_test("Get Cart (Guest)", False, f"Status: {status}, Data: {data}")
        
        # Test authenticated cart
        if self.customer_token:
            headers = self.get_auth_headers(self.customer_token)
            success, data, status = self.make_request('GET', '/cart', headers=headers)
            if success and 'items' in data:
                self.log_test("Get Cart (Authenticated)", True, f"Cart has {len(data['items'])} items")
                return True
            else:
                self.log_test("Get Cart (Authenticated)", False, f"Status: {status}, Data: {data}")
                return False
        
        return True

    def test_create_order(self):
        """Test creating an order"""
        if not self.customer_token:
            self.log_test("Create Order", False, "No customer token available")
            return False
        
        order_data = {
            "items": [{"product_id": self.products[0]['id'], "quantity": 1}],
            "shipping_address": {
                "full_name": "Test Customer",
                "phone": "+971501234567",
                "address_line1": "Test Address",
                "city": "Dubai",
                "emirate": "Dubai"
            },
            "payment_method": "cod",
            "notes": "Test order"
        }
        
        headers = self.get_auth_headers(self.customer_token)
        success, data, status = self.make_request('POST', '/orders', order_data, headers)
        if success and 'order_id' in data:
            self.test_order_id = data['order_id']
            self.log_test("Create Order", True, f"Order ID: {data['order_id']}")
            return True
        else:
            self.log_test("Create Order", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_orders(self):
        """Test getting customer orders"""
        if not self.customer_token:
            self.log_test("Get Orders", False, "No customer token available")
            return False
        
        headers = self.get_auth_headers(self.customer_token)
        success, data, status = self.make_request('GET', '/orders', headers=headers)
        if success and 'orders' in data:
            self.log_test("Get Orders", True, f"Found {len(data['orders'])} orders")
            return True
        else:
            self.log_test("Get Orders", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_dashboard_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_test("Admin Dashboard Stats", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, data, status = self.make_request('GET', '/dashboard/stats', headers=headers)
        if success and 'total_products' in data:
            self.log_test("Admin Dashboard Stats", True, f"Stats: {data}")
            return True
        else:
            self.log_test("Admin Dashboard Stats", False, f"Status: {status}, Data: {data}")
            return False

    def test_admin_get_all_orders(self):
        """Test admin getting all orders"""
        if not self.admin_token:
            self.log_test("Admin Get All Orders", False, "No admin token available")
            return False
        
        headers = self.get_auth_headers(self.admin_token)
        success, data, status = self.make_request('GET', '/orders/all', headers=headers)
        if success and 'orders' in data:
            self.log_test("Admin Get All Orders", True, f"Found {len(data['orders'])} orders")
            return True
        else:
            self.log_test("Admin Get All Orders", False, f"Status: {status}, Data: {data}")
            return False

    def test_settings(self):
        """Test getting public settings"""
        success, data, status = self.make_request('GET', '/settings')
        if success and 'payment_enabled' in data:
            self.settings = data
            self.log_test("Get Settings", True)
            return True
        else:
            self.log_test("Get Settings", False, f"Status: {status}, Data: {data}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting GPGT E-Commerce Backend API Tests")
        print("=" * 60)
        
        # Basic API tests
        self.test_api_root()
        self.test_seed_data()
        
        # Authentication tests
        self.test_admin_login()
        self.test_customer_registration()
        self.test_customer_login()
        
        # Product and category tests
        self.test_get_categories()
        self.test_get_products()
        self.test_get_product_detail()
        
        # Cart tests
        self.test_add_to_cart()
        self.test_get_cart()
        
        # Order tests
        self.test_create_order()
        self.test_get_orders()
        
        # Admin tests
        self.test_admin_dashboard_stats()
        self.test_admin_get_all_orders()
        
        # Settings tests
        self.test_settings()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = GPGTAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())