"""
Backend API tests for User Account Dashboard features
Tests:
- Customer login redirects to /account (frontend behavior)
- Admin login redirects to /admin (frontend behavior)
- PUT /api/users/profile endpoint for profile updates
- GET /api/orders endpoint for user orders
- User authentication and authorization
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quote-catalog-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


class TestCustomerAuthentication:
    """Test customer authentication and profile access"""
    
    def test_customer_login_success(self):
        """Test customer can login with correct credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "test123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User data missing from response"
        assert data["user"]["email"] == "testcustomer@test.com"
        assert data["user"]["role"] == "customer"
        
        print(f"Customer login successful: {data['user']['email']}")
        return data["token"]
    
    def test_customer_login_invalid_credentials(self):
        """Test login fails with wrong credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminAuthentication:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test admin can login with correct credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "admin@gpgt.ae",
            "password": "admin123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User data missing from response"
        assert data["user"]["email"] == "admin@gpgt.ae"
        assert data["user"]["role"] == "admin"
        
        print(f"Admin login successful: {data['user']['email']}")
        return data["token"]


class TestProfileUpdate:
    """Test profile update endpoint PUT /api/users/profile"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer token for authenticated requests"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip("Cannot login as customer")
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "admin@gpgt.ae",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Cannot login as admin")
        return response.json()["token"]
    
    def test_profile_update_requires_auth(self):
        """Test profile update requires authentication"""
        response = requests.put(f"{API}/users/profile", json={
            "name": "Test Name",
            "phone": "+971501234567"
        })
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_customer_profile_update_name(self, customer_token):
        """Test customer can update their name"""
        response = requests.put(
            f"{API}/users/profile",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"name": "Test Customer Updated"}
        )
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Profile update response: {data}")
    
    def test_customer_profile_update_phone(self, customer_token):
        """Test customer can update their phone"""
        response = requests.put(
            f"{API}/users/profile",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"phone": "+971509876543"}
        )
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Profile update response: {data}")
    
    def test_customer_profile_update_both(self, customer_token):
        """Test customer can update both name and phone"""
        response = requests.put(
            f"{API}/users/profile",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "name": "Test Customer Final",
                "phone": "+971501234567"
            }
        )
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Profile update response: {data}")
    
    def test_admin_profile_update(self, admin_token):
        """Test admin can update their profile"""
        response = requests.put(
            f"{API}/users/profile",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Admin User Updated",
                "phone": "+971 4 456 7891"
            }
        )
        
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Admin profile update response: {data}")


class TestOrdersEndpoint:
    """Test orders endpoint GET /api/orders"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer token for authenticated requests"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip("Cannot login as customer")
        return response.json()["token"]
    
    def test_orders_requires_auth(self):
        """Test orders endpoint requires authentication"""
        response = requests.get(f"{API}/orders")
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_customer_can_get_orders(self, customer_token):
        """Test customer can get their orders"""
        response = requests.get(
            f"{API}/orders",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "orders" in data, "orders field missing"
        assert "total" in data, "total field missing"
        assert "page" in data, "page field missing"
        assert "pages" in data, "pages field missing"
        
        print(f"Customer orders: total={data['total']}, page={data['page']}")
    
    def test_orders_pagination(self, customer_token):
        """Test orders endpoint supports pagination"""
        response = requests.get(
            f"{API}/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            params={"page": 1, "limit": 10}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert "total" in data
        assert data["page"] == 1
        print(f"Orders pagination: page={data['page']}, total={data['total']}")


class TestAuthMeEndpoint:
    """Test /api/auth/me endpoint for getting current user"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer token for authenticated requests"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "testcustomer@test.com",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip("Cannot login as customer")
        return response.json()["token"]
    
    def test_auth_me_requires_auth(self):
        """Test /api/auth/me requires authentication"""
        response = requests.get(f"{API}/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_auth_me_returns_user_data(self, customer_token):
        """Test /api/auth/me returns current user data"""
        response = requests.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        data = response.json()
        
        # Verify user data fields
        assert "id" in data, "id field missing"
        assert "email" in data, "email field missing"
        assert "name" in data, "name field missing"
        assert "role" in data, "role field missing"
        assert "created_at" in data, "created_at field missing"
        
        assert data["email"] == "testcustomer@test.com"
        assert data["role"] == "customer"
        
        print(f"Current user: {data['email']}, role: {data['role']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
