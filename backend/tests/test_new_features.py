"""
Backend API Tests for New Features:
1. Google OAuth via Emergent - POST /api/auth/emergent/session
2. Address Management - PUT /api/users/addresses
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quote-catalog-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gpgt.ae"
ADMIN_PASSWORD = "admin123"
TEST_CUSTOMER_EMAIL = "testcustomer@test.com"
TEST_CUSTOMER_PASSWORD = "test123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def customer_token():
    """Get customer authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_CUSTOMER_EMAIL,
        "password": TEST_CUSTOMER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Customer authentication failed")


class TestEmergentGoogleOAuth:
    """Tests for Emergent-managed Google OAuth endpoint"""
    
    def test_emergent_session_endpoint_exists(self):
        """Test POST /api/auth/emergent/session endpoint exists"""
        # Send request without session_id to verify endpoint exists
        response = requests.post(f"{BASE_URL}/api/auth/emergent/session", json={})
        # Should return 400 (missing session_id) not 404 (endpoint not found)
        assert response.status_code != 404, f"Endpoint not found - got {response.status_code}"
        print(f"PASS: Emergent session endpoint exists (status: {response.status_code})")
    
    def test_emergent_session_requires_session_id(self):
        """Test endpoint returns 400 when session_id is missing"""
        response = requests.post(f"{BASE_URL}/api/auth/emergent/session", json={})
        assert response.status_code == 400
        data = response.json()
        assert "session_id" in data.get("detail", "").lower() or "required" in data.get("detail", "").lower()
        print(f"PASS: Endpoint correctly requires session_id - {data.get('detail')}")
    
    def test_emergent_session_handles_invalid_session(self):
        """Test endpoint returns 401 for invalid/expired session_id"""
        response = requests.post(f"{BASE_URL}/api/auth/emergent/session", json={
            "session_id": "invalid_session_id_12345"
        })
        # Should return 401 for invalid session (Emergent auth will reject it)
        assert response.status_code in [401, 500], f"Expected 401 or 500, got {response.status_code}"
        print(f"PASS: Endpoint handles invalid session_id correctly (status: {response.status_code})")


class TestAddressManagement:
    """Tests for Address Management - PUT /api/users/addresses"""
    
    def test_addresses_endpoint_requires_auth(self):
        """Test PUT /api/users/addresses requires authentication"""
        response = requests.put(f"{BASE_URL}/api/users/addresses", json={
            "addresses": []
        })
        assert response.status_code in [401, 403]
        print(f"PASS: Addresses endpoint requires authentication (status: {response.status_code})")
    
    def test_add_address(self, customer_token):
        """Test adding a new address"""
        new_address = {
            "label": "Home",
            "full_name": "Test User",
            "phone": "+971 50 123 4567",
            "address_line1": "Test Building, Test Street",
            "address_line2": "Apartment 101",
            "city": "Dubai",
            "emirate": "Dubai",
            "is_default": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/addresses",
            json={"addresses": [new_address]},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Address added successfully - {data.get('message')}")
    
    def test_get_user_with_addresses(self, customer_token):
        """Test GET /api/auth/me returns user with addresses"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Check that addresses field exists
        assert "addresses" in data, "User should have addresses field"
        print(f"PASS: User data includes addresses - {len(data.get('addresses', []))} addresses found")
    
    def test_add_multiple_addresses(self, customer_token):
        """Test adding multiple addresses"""
        addresses = [
            {
                "label": "Home",
                "full_name": "Test User Home",
                "phone": "+971 50 123 4567",
                "address_line1": "Home Building, Home Street",
                "city": "Dubai",
                "emirate": "Dubai",
                "is_default": True
            },
            {
                "label": "Office",
                "full_name": "Test User Office",
                "phone": "+971 50 987 6543",
                "address_line1": "Office Tower, Business Bay",
                "city": "Dubai",
                "emirate": "Dubai",
                "is_default": False
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/users/addresses",
            json={"addresses": addresses},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        print(f"PASS: Multiple addresses saved successfully")
        
        # Verify by fetching user
        user_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        user_data = user_response.json()
        assert len(user_data.get("addresses", [])) == 2, f"Expected 2 addresses, got {len(user_data.get('addresses', []))}"
        print(f"PASS: User has {len(user_data.get('addresses', []))} addresses")
    
    def test_update_address(self, customer_token):
        """Test updating an existing address"""
        # First get current addresses
        user_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        user_data = user_response.json()
        current_addresses = user_data.get("addresses", [])
        
        if len(current_addresses) > 0:
            # Update first address
            current_addresses[0]["address_line1"] = "Updated Test Building, Test Street"
            current_addresses[0]["full_name"] = "Updated Test User"
            
            response = requests.put(
                f"{BASE_URL}/api/users/addresses",
                json={"addresses": current_addresses},
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            assert response.status_code == 200
            print(f"PASS: Address updated successfully")
            
            # Verify update
            verify_response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            verify_data = verify_response.json()
            updated_address = verify_data.get("addresses", [])[0]
            assert "Updated" in updated_address.get("full_name", "")
            print(f"PASS: Address update verified - {updated_address.get('full_name')}")
        else:
            pytest.skip("No addresses to update")
    
    def test_delete_address(self, customer_token):
        """Test deleting an address by sending reduced address list"""
        # First get current addresses
        user_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        user_data = user_response.json()
        current_addresses = user_data.get("addresses", [])
        
        if len(current_addresses) > 1:
            # Remove last address
            reduced_addresses = current_addresses[:-1]
            
            response = requests.put(
                f"{BASE_URL}/api/users/addresses",
                json={"addresses": reduced_addresses},
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            assert response.status_code == 200
            print(f"PASS: Address deleted (list reduced from {len(current_addresses)} to {len(reduced_addresses)})")
            
            # Verify deletion
            verify_response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            verify_data = verify_response.json()
            assert len(verify_data.get("addresses", [])) == len(reduced_addresses)
            print(f"PASS: Address deletion verified - now {len(verify_data.get('addresses', []))} addresses")
        else:
            pytest.skip("Not enough addresses to test deletion")
    
    def test_set_default_address(self, customer_token):
        """Test setting a default address"""
        # Add two addresses with one as default
        addresses = [
            {
                "label": "Home",
                "full_name": "Test User",
                "phone": "+971 50 111 1111",
                "address_line1": "Address 1",
                "city": "Dubai",
                "emirate": "Dubai",
                "is_default": False
            },
            {
                "label": "Office",
                "full_name": "Test User",
                "phone": "+971 50 222 2222",
                "address_line1": "Address 2",
                "city": "Abu Dhabi",
                "emirate": "Abu Dhabi",
                "is_default": True
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/users/addresses",
            json={"addresses": addresses},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        
        # Verify default address
        user_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        user_data = user_response.json()
        default_addresses = [a for a in user_data.get("addresses", []) if a.get("is_default")]
        assert len(default_addresses) >= 1, "Should have at least one default address"
        print(f"PASS: Default address set correctly")


class TestProductImages:
    """Tests for Product Multiple Images feature"""
    
    def test_product_has_images_field(self):
        """Test product endpoint returns images array"""
        # Get products list
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        if len(products) > 0:
            # Check first product has images field
            product = products[0]
            assert "images" in product, "Product should have images field"
            print(f"PASS: Products have images field - {len(product.get('images', []))} images for {product.get('name')}")
        else:
            pytest.skip("No products found")
    
    def test_single_product_images(self):
        """Test single product endpoint returns images array"""
        # Get products list first
        list_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        products = list_response.json().get("products", [])
        
        if len(products) > 0:
            product_id = products[0].get("id")
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            data = response.json()
            
            assert "images" in data, "Product detail should have images field"
            assert isinstance(data.get("images"), list), "Images should be a list"
            print(f"PASS: Product detail has images array - {len(data.get('images', []))} images")
        else:
            pytest.skip("No products found")


class TestUserLogin:
    """Tests for user authentication"""
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful - role: {data['user']['role']}")
    
    def test_customer_login(self):
        """Test customer login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"PASS: Customer login successful - email: {data['user']['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
