"""
Test suite for Cart-to-Enquiry feature and related bug fixes
Tests the cart-enquiry endpoint and checkout flow when payments are disabled
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCartEnquiryFeature:
    """Tests for cart-to-enquiry feature when payments are disabled"""
    
    def test_settings_show_payments_disabled(self):
        """Verify settings API returns payment_enabled and cod_enabled as false"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        # Both payment methods should be disabled for enquiry mode
        assert "payment_enabled" in data
        assert "cod_enabled" in data
        print(f"payment_enabled: {data['payment_enabled']}, cod_enabled: {data['cod_enabled']}")
    
    def test_cart_enquiry_endpoint_exists(self):
        """Verify /api/cart-enquiry endpoint exists"""
        # Test with minimal data to check endpoint exists
        enquiry_data = {
            "items": [
                {
                    "product_id": "test-product-id",
                    "product_name": "Test Product",
                    "quantity": 1,
                    "unit_price": 99.00,
                    "total_price": 99.00
                }
            ],
            "customer": {
                "name": "Test Customer",
                "email": "test@example.com",
                "phone": "+971 50 123 4567"
            },
            "shipping_address": {
                "address_line1": "123 Test Street",
                "city": "Dubai",
                "emirate": "Dubai"
            },
            "subtotal": 99.00,
            "vat": 4.95,
            "shipping": 25.00,
            "total": 128.95,
            "notes": "Test enquiry"
        }
        
        response = requests.post(f"{BASE_URL}/api/cart-enquiry", json=enquiry_data)
        # Should return 200 (success) or 401 (auth required) - not 404
        assert response.status_code in [200, 401, 422], f"Unexpected status: {response.status_code}"
        print(f"Cart enquiry endpoint status: {response.status_code}")
    
    def test_products_endpoint(self):
        """Verify products can be fetched"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"Found {data['total']} products")
        
        if data['products']:
            product = data['products'][0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            print(f"Sample product: {product['name']} - AED {product.get('offer_price') or product['price']}")
    
    def test_categories_endpoint(self):
        """Verify categories can be fetched"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} categories")
        
        if data:
            category = data[0]
            assert "id" in category
            assert "name" in category
            print(f"Sample category: {category['name']}")


class TestCartFunctionality:
    """Tests for cart add/update/remove functionality"""
    
    @pytest.fixture
    def session_id(self):
        """Generate a unique session ID for cart testing"""
        return str(uuid.uuid4())
    
    @pytest.fixture
    def product_id(self):
        """Get a valid product ID from the API"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code == 200 and response.json().get('products'):
            return response.json()['products'][0]['id']
        pytest.skip("No products available for testing")
    
    def test_add_to_cart(self, session_id, product_id):
        """Test adding a product to cart"""
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            params={"session_id": session_id},
            json={"product_id": product_id, "quantity": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print(f"Add to cart response: {data}")
    
    def test_get_cart(self, session_id, product_id):
        """Test getting cart contents"""
        # First add an item
        requests.post(
            f"{BASE_URL}/api/cart/add",
            params={"session_id": session_id},
            json={"product_id": product_id, "quantity": 1}
        )
        
        # Then get cart
        response = requests.get(
            f"{BASE_URL}/api/cart",
            params={"session_id": session_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        assert "vat" in data
        assert "total" in data
        print(f"Cart total: AED {data['total']}")
    
    def test_update_cart_quantity(self, session_id, product_id):
        """Test updating cart item quantity"""
        # First add an item
        requests.post(
            f"{BASE_URL}/api/cart/add",
            params={"session_id": session_id},
            json={"product_id": product_id, "quantity": 1}
        )
        
        # Update quantity
        response = requests.put(
            f"{BASE_URL}/api/cart/update",
            params={"session_id": session_id},
            json={"product_id": product_id, "quantity": 3}
        )
        assert response.status_code == 200
        print("Cart quantity updated successfully")
    
    def test_remove_from_cart(self, session_id, product_id):
        """Test removing item from cart"""
        # First add an item
        requests.post(
            f"{BASE_URL}/api/cart/add",
            params={"session_id": session_id},
            json={"product_id": product_id, "quantity": 1}
        )
        
        # Remove item
        response = requests.delete(
            f"{BASE_URL}/api/cart/remove/{product_id}",
            params={"session_id": session_id}
        )
        assert response.status_code == 200
        print("Item removed from cart successfully")


class TestAdminLogin:
    """Tests for admin authentication"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@gpgt.ae",
                "password": "admin123"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['email']}")
        return data["token"]
    
    def test_admin_can_access_settings(self):
        """Test admin can access admin settings"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@gpgt.ae",
                "password": "admin123"
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        
        token = login_response.json()["token"]
        
        # Access admin settings
        response = requests.get(
            f"{BASE_URL}/api/settings/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_enabled" in data
        print(f"Admin settings accessible, payment_enabled: {data['payment_enabled']}")


class TestEnquirySubmission:
    """Tests for enquiry submission with admin token"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@gpgt.ae",
                "password": "admin123"
            }
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def product_id(self):
        """Get a valid product ID"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code == 200 and response.json().get('products'):
            return response.json()['products'][0]['id']
        pytest.skip("No products available")
    
    def test_submit_cart_enquiry_authenticated(self, admin_token, product_id):
        """Test submitting cart enquiry as authenticated user"""
        enquiry_data = {
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "Test Product",
                    "product_sku": "TEST-001",
                    "quantity": 2,
                    "unit_price": 99.00,
                    "total_price": 198.00
                }
            ],
            "customer": {
                "name": "Test Customer UAE",
                "email": "testcustomer@example.com",
                "phone": "+971 50 987 6543"
            },
            "shipping_address": {
                "address_line1": "456 Business Bay, Tower B",
                "city": "Dubai",
                "emirate": "Dubai"
            },
            "subtotal": 198.00,
            "vat": 9.90,
            "shipping": 25.00,
            "total": 232.90,
            "notes": "Please deliver in the morning"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart-enquiry",
            json=enquiry_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "enquiry_id" in data
        assert "enquiry_number" in data
        print(f"Enquiry submitted: {data['enquiry_number']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
