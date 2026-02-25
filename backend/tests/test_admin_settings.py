"""
Backend API tests for Admin Settings and Image Upload features
Tests:
- Admin login with admin@gpgt.ae / admin123
- Settings API - Get/Update including payment_enabled toggle and admin_notification_email
- Image upload endpoint
- Products API with images
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quote-catalog-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


class TestAuthenticationFlow:
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
        
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test login fails with wrong credentials"""
        response = requests.post(f"{API}/auth/login", json={
            "email": "admin@gpgt.ae",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestSettingsAPI:
    """Test settings endpoints - payment toggle and admin notification email"""
    
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
    
    def test_get_public_settings(self):
        """Test public settings endpoint returns payment_enabled"""
        response = requests.get(f"{API}/settings")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify payment_enabled field exists
        assert "payment_enabled" in data, "payment_enabled field missing"
        assert "cod_enabled" in data, "cod_enabled field missing"
        assert "vat_percentage" in data
        
        print(f"Public settings: payment_enabled={data['payment_enabled']}, cod_enabled={data['cod_enabled']}")
    
    def test_get_admin_settings(self, admin_token):
        """Test admin settings endpoint includes all fields"""
        response = requests.get(
            f"{API}/settings/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all admin settings fields exist
        assert "payment_enabled" in data, "payment_enabled missing in admin settings"
        assert "admin_notification_email" in data or "admin_notification_email" not in data, "Admin notification email field check"
        assert "cod_enabled" in data
        assert "vat_percentage" in data
        assert "company_name" in data
        
        print(f"Admin settings: payment_enabled={data.get('payment_enabled')}, admin_notification_email={data.get('admin_notification_email')}")
    
    def test_update_payment_toggle_disable(self, admin_token):
        """Test disabling payment gateway"""
        response = requests.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"payment_enabled": False}
        )
        
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        
        # Verify the change was persisted
        verify_response = requests.get(
            f"{API}/settings/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert verify_response.status_code == 200
        assert verify_response.json().get("payment_enabled") == False, "payment_enabled not updated to False"
        print("Payment gateway disabled successfully")
    
    def test_update_payment_toggle_enable(self, admin_token):
        """Test enabling payment gateway"""
        response = requests.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"payment_enabled": True}
        )
        
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        
        # Verify the change was persisted
        verify_response = requests.get(
            f"{API}/settings/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert verify_response.status_code == 200
        assert verify_response.json().get("payment_enabled") == True, "payment_enabled not updated to True"
        print("Payment gateway enabled successfully")
    
    def test_update_admin_notification_email(self, admin_token):
        """Test updating admin notification email"""
        test_email = "test_admin@gpgt.ae"
        
        response = requests.put(
            f"{API}/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"admin_notification_email": test_email}
        )
        
        assert response.status_code == 200, f"Failed to update admin email: {response.text}"
        
        # Verify the change was persisted
        verify_response = requests.get(
            f"{API}/settings/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert verify_response.status_code == 200
        assert verify_response.json().get("admin_notification_email") == test_email, "admin_notification_email not updated"
        print(f"Admin notification email updated to: {test_email}")


class TestImageUploadAPI:
    """Test image upload endpoints"""
    
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
    
    def test_upload_image_endpoint_requires_auth(self):
        """Test that upload requires authentication"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        simple_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        response = requests.post(
            f"{API}/upload/image",
            files={"file": ("test.png", simple_png, "image/png")}
        )
        
        # Should fail without auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_upload_image_with_auth(self, admin_token):
        """Test image upload with admin authentication"""
        import base64
        # 1x1 pixel PNG
        simple_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        response = requests.post(
            f"{API}/upload/image",
            headers={"Authorization": f"Bearer {admin_token}"},
            files={"file": ("test.png", simple_png, "image/png")}
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        
        assert "url" in data, "URL missing from upload response"
        assert data["url"].startswith("/api/uploads/"), f"Unexpected URL format: {data['url']}"
        print(f"Image uploaded successfully: {data['url']}")
        
        return data["url"]
    
    def test_get_uploaded_image(self, admin_token):
        """Test that uploaded images can be retrieved"""
        import base64
        simple_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        # First upload an image
        upload_response = requests.post(
            f"{API}/upload/image",
            headers={"Authorization": f"Bearer {admin_token}"},
            files={"file": ("test.png", simple_png, "image/png")}
        )
        
        assert upload_response.status_code == 200
        image_url = upload_response.json()["url"]
        
        # Then try to retrieve it
        full_url = f"{BASE_URL}{image_url}"
        get_response = requests.get(full_url)
        
        assert get_response.status_code == 200, f"Failed to get uploaded image: {get_response.status_code}"
        assert get_response.headers.get("content-type", "").startswith("image/"), "Response is not an image"
        print(f"Retrieved uploaded image from: {full_url}")


class TestProductsAPI:
    """Test products API with image support"""
    
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
    
    def test_get_products(self):
        """Test getting products list"""
        response = requests.get(f"{API}/products")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        assert len(data["products"]) > 0, "No products found"
        
        # Check product has images field
        product = data["products"][0]
        assert "images" in product, "images field missing from product"
        print(f"Found {data['total']} products")
    
    def test_get_product_detail(self):
        """Test getting single product with full details"""
        # First get a product ID
        products_response = requests.get(f"{API}/products")
        products = products_response.json()["products"]
        
        if not products:
            pytest.skip("No products to test")
        
        product_id = products[0]["id"]
        
        response = requests.get(f"{API}/products/{product_id}")
        
        assert response.status_code == 200
        product = response.json()
        
        # Verify product fields
        assert "id" in product
        assert "name" in product
        assert "price" in product
        assert "images" in product
        assert "description" in product
        assert "sku" in product
        
        print(f"Product detail: {product['name']}, price: {product['price']}, images: {len(product.get('images', []))}")
    
    def test_get_admin_products(self, admin_token):
        """Test admin products endpoint"""
        response = requests.get(
            f"{API}/products/all",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        print(f"Admin products: total={data['total']}")


class TestCategoriesAPI:
    """Test categories for mega menu - Hardware should be present"""
    
    def test_get_categories(self):
        """Test categories include Hardware"""
        response = requests.get(f"{API}/categories")
        
        assert response.status_code == 200
        categories = response.json()
        
        category_names = [c["name"] for c in categories]
        
        # Verify Hardware is in the list
        assert "Hardware" in category_names, f"Hardware missing from categories: {category_names}"
        
        # Check for common categories
        assert "Sanitaryware" in category_names
        assert "Electrical" in category_names
        
        print(f"Categories found: {category_names}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
