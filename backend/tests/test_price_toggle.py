"""
Tests for Price Hide/Show Toggle Feature (Quotation Mode)
Tests the show_prices setting in ERP Settings and its effect on public settings API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gpgt.ae"
ADMIN_PASSWORD = "admin123"

class TestPriceToggleFeature:
    """Tests for price visibility toggle feature"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Return authorization headers"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    # === Public Settings API Tests ===
    
    def test_get_public_settings_includes_show_prices(self):
        """Test that public settings API returns show_prices field"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, f"GET /api/settings failed: {response.text}"
        
        data = response.json()
        assert "show_prices" in data, "show_prices field missing from public settings"
        assert isinstance(data["show_prices"], bool), "show_prices should be boolean"
        print(f"Public settings show_prices: {data['show_prices']}")
    
    # === ERP Settings API Tests ===
    
    def test_get_erp_settings_includes_show_prices(self, auth_headers):
        """Test that ERP settings API returns show_prices field"""
        response = requests.get(f"{BASE_URL}/api/erp/settings", headers=auth_headers)
        assert response.status_code == 200, f"GET /api/erp/settings failed: {response.text}"
        
        data = response.json()
        assert "show_prices" in data, "show_prices field missing from ERP settings"
        print(f"ERP settings show_prices: {data['show_prices']}")
    
    def test_update_erp_settings_show_prices_false(self, auth_headers):
        """Test setting show_prices to false (Quotation Mode)"""
        response = requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": False}
        )
        assert response.status_code == 200, f"PUT /api/erp/settings failed: {response.text}"
        
        # Verify the change
        verify_response = requests.get(f"{BASE_URL}/api/settings")
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert data["show_prices"] == False, "show_prices should be False after update"
        print("Successfully set show_prices to False (Quotation Mode)")
    
    def test_update_erp_settings_show_prices_true(self, auth_headers):
        """Test setting show_prices to true (Normal Mode)"""
        response = requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": True}
        )
        assert response.status_code == 200, f"PUT /api/erp/settings failed: {response.text}"
        
        # Verify the change
        verify_response = requests.get(f"{BASE_URL}/api/settings")
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert data["show_prices"] == True, "show_prices should be True after update"
        print("Successfully set show_prices to True (Normal Mode)")
    
    def test_erp_settings_requires_authentication(self):
        """Test that ERP settings requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/erp/settings")
        assert response.status_code in [401, 403], "ERP settings should require authentication"
        
        response = requests.put(f"{BASE_URL}/api/erp/settings", json={"show_prices": False})
        assert response.status_code in [401, 403], "ERP settings update should require authentication"
        print("ERP settings correctly requires authentication")
    
    # === Products API Tests ===
    
    def test_products_list_works_regardless_of_price_setting(self, auth_headers):
        """Test that products list API works regardless of show_prices setting"""
        # Set show_prices to false
        requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": False}
        )
        
        # Products should still be accessible
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200, f"Products API failed: {response.text}"
        data = response.json()
        assert "products" in data, "Products list should be returned"
        
        # Reset to true
        requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": True}
        )
        print("Products API works regardless of show_prices setting")
    
    def test_single_product_works_regardless_of_price_setting(self, auth_headers):
        """Test that single product API works regardless of show_prices setting"""
        # Get a product ID first
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200
        products = products_response.json().get("products", [])
        
        if products:
            product_id = products[0]["id"]
            
            # Set show_prices to false
            requests.put(
                f"{BASE_URL}/api/erp/settings",
                headers=auth_headers,
                json={"show_prices": False}
            )
            
            # Single product should still be accessible
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200, f"Single product API failed: {response.text}"
            
            # Reset to true
            requests.put(
                f"{BASE_URL}/api/erp/settings",
                headers=auth_headers,
                json={"show_prices": True}
            )
            print(f"Single product API works regardless of show_prices setting (tested product: {product_id})")
        else:
            pytest.skip("No products available for testing")
    
    # === Cart Enquiry API Tests ===
    
    def test_cart_enquiry_api_exists(self, auth_headers):
        """Test that cart enquiry API endpoint exists"""
        # This is used for quotation mode checkout
        response = requests.post(
            f"{BASE_URL}/api/cart-enquiry",
            headers=auth_headers,
            json={
                "items": [],
                "customer": {"name": "Test", "email": "test@test.com", "phone": "+971501234567"},
                "shipping_address": {"address_line1": "Test", "city": "Dubai", "emirate": "Dubai"},
                "subtotal": 0, "vat": 0, "shipping": 0, "total": 0
            }
        )
        # Should return success (empty cart is allowed)
        assert response.status_code in [200, 201], f"Cart enquiry API failed: {response.text}"
        print("Cart enquiry API works correctly")


class TestPriceToggleIntegration:
    """Integration tests to verify price toggle state is consistent"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Return authorization headers"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_toggle_state_consistency(self, auth_headers):
        """Test that show_prices state is consistent between ERP and public settings"""
        # Set to false
        requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": False}
        )
        
        # Check ERP settings
        erp_response = requests.get(f"{BASE_URL}/api/erp/settings", headers=auth_headers)
        erp_data = erp_response.json()
        
        # Check public settings
        public_response = requests.get(f"{BASE_URL}/api/settings")
        public_data = public_response.json()
        
        assert erp_data.get("show_prices") == public_data.get("show_prices"), \
            "show_prices should be consistent between ERP and public settings"
        print(f"State consistency check passed: show_prices={public_data['show_prices']}")
        
        # Reset to true
        requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": True}
        )
    
    def test_final_state_reset_to_true(self, auth_headers):
        """Ensure show_prices is set to true at the end of tests"""
        response = requests.put(
            f"{BASE_URL}/api/erp/settings",
            headers=auth_headers,
            json={"show_prices": True}
        )
        assert response.status_code == 200
        
        # Verify
        public_response = requests.get(f"{BASE_URL}/api/settings")
        assert public_response.json().get("show_prices") == True
        print("show_prices reset to True for subsequent tests")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
