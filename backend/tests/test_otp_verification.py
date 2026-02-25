"""
Test suite for Email OTP Verification System
Tests: Registration, OTP verification, resend OTP, admin verification management
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quote-catalog-1.preview.emergentagent.com').rstrip('/')

class TestOTPVerificationSystem:
    """Test OTP verification endpoints and flows"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_email = f"test_otp_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "testpass123"
        self.test_name = "OTP Test User"
        self.admin_email = "admin@gpgt.ae"
        self.admin_password = "admin123"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    # ==================== REGISTRATION TESTS ====================
    
    def test_registration_creates_unverified_user(self):
        """Test that registration creates user with email_verified=False"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "token" in data, "Token not returned"
        assert "user" in data, "User not returned"
        assert "requires_verification" in data, "requires_verification flag missing"
        
        # Check user is unverified
        user = data["user"]
        assert user.get("email_verified") == False, "User should be unverified after registration"
        assert data.get("requires_verification") == True, "requires_verification should be True"
        
        # Store token for later tests
        self.user_token = data["token"]
        self.user_id = user["id"]
        print(f"✓ Registration creates unverified user: {self.test_email}")
    
    def test_registration_returns_verification_message(self):
        """Test that registration returns appropriate message"""
        test_email = f"test_msg_{uuid.uuid4().hex[:8]}@test.com"
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data, "Message not returned"
        assert "verify" in data["message"].lower(), "Message should mention verification"
        print(f"✓ Registration returns verification message")
    
    # ==================== LOGIN TESTS ====================
    
    def test_login_returns_verification_status(self):
        """Test that login returns email_verified status"""
        # First register a user
        test_email = f"test_login_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        
        # Now login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": self.test_password
        })
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "user" in data
        assert "email_verified" in data["user"], "email_verified field missing in login response"
        assert data["user"]["email_verified"] == False, "User should still be unverified"
        print(f"✓ Login returns verification status")
    
    # ==================== VERIFICATION STATUS ENDPOINT ====================
    
    def test_verification_status_endpoint(self):
        """Test /auth/verification-status endpoint"""
        # Register a user
        test_email = f"test_status_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Check verification status
        status_response = self.session.get(
            f"{BASE_URL}/api/auth/verification-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert status_response.status_code == 200
        data = status_response.json()
        assert "email_verified" in data, "email_verified missing"
        assert "can_checkout" in data, "can_checkout missing"
        assert data["email_verified"] == False
        assert data["can_checkout"] == False, "Unverified user should not be able to checkout"
        print(f"✓ Verification status endpoint works correctly")
    
    # ==================== RESEND OTP TESTS ====================
    
    def test_resend_otp_endpoint(self):
        """Test /auth/resend-email-otp endpoint"""
        # Register a user
        test_email = f"test_resend_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Wait for cooldown (30 seconds) - skip in test, just verify endpoint exists
        # First call should fail due to cooldown
        resend_response = self.session.post(
            f"{BASE_URL}/api/auth/resend-email-otp",
            headers={"Authorization": f"Bearer {token}"},
            json={}
        )
        
        # Should return 429 (cooldown) or 200 (success)
        assert resend_response.status_code in [200, 429], f"Unexpected status: {resend_response.status_code}"
        
        if resend_response.status_code == 429:
            data = resend_response.json()
            assert "wait" in data.get("detail", "").lower() or "seconds" in data.get("detail", "").lower()
            print(f"✓ Resend OTP respects cooldown period")
        else:
            print(f"✓ Resend OTP endpoint works")
    
    def test_resend_otp_requires_auth(self):
        """Test that resend OTP requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/auth/resend-email-otp", json={})
        assert response.status_code == 401, "Should require authentication"
        print(f"✓ Resend OTP requires authentication")
    
    # ==================== VERIFY EMAIL TESTS ====================
    
    def test_verify_email_invalid_otp(self):
        """Test that invalid OTP is rejected"""
        # Register a user
        test_email = f"test_invalid_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Try to verify with invalid OTP
        verify_response = self.session.post(
            f"{BASE_URL}/api/auth/verify-email",
            headers={"Authorization": f"Bearer {token}"},
            json={"otp": "000000"}
        )
        
        assert verify_response.status_code == 400, "Invalid OTP should be rejected"
        data = verify_response.json()
        assert "invalid" in data.get("detail", "").lower() or "attempts" in data.get("detail", "").lower()
        print(f"✓ Invalid OTP is rejected")
    
    def test_verify_email_requires_auth(self):
        """Test that verify email requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/auth/verify-email", json={"otp": "123456"})
        assert response.status_code == 401, "Should require authentication"
        print(f"✓ Verify email requires authentication")
    
    # ==================== ADMIN CUSTOMER MANAGEMENT TESTS ====================
    
    def test_admin_customers_endpoint(self):
        """Test /admin/customers endpoint returns customer list with verification status"""
        admin_token = self.get_admin_token()
        assert admin_token, "Failed to get admin token"
        
        response = self.session.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get customers: {response.text}"
        data = response.json()
        assert "customers" in data, "customers field missing"
        
        # Check that customers have email_verified field
        if len(data["customers"]) > 0:
            customer = data["customers"][0]
            assert "email_verified" in customer or customer.get("email_verified") is not None or "email_verified" in str(customer)
            print(f"✓ Admin customers endpoint returns {len(data['customers'])} customers with verification status")
        else:
            print(f"✓ Admin customers endpoint works (no customers yet)")
    
    def test_admin_manual_verify_email(self):
        """Test admin can manually verify user email"""
        # First register a test user
        test_email = f"test_admin_verify_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["user"]["id"]
        
        # Get admin token
        admin_token = self.get_admin_token()
        assert admin_token, "Failed to get admin token"
        
        # Admin manually verifies the user
        verify_response = self.session.post(
            f"{BASE_URL}/api/admin/users/{user_id}/verify-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        
        assert verify_response.status_code == 200, f"Admin verify failed: {verify_response.text}"
        print(f"✓ Admin can manually verify user email")
        
        # Verify the user is now verified
        user_token = reg_response.json()["token"]
        status_response = self.session.get(
            f"{BASE_URL}/api/auth/verification-status",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert status_response.status_code == 200
        assert status_response.json().get("email_verified") == True, "User should be verified after admin action"
        print(f"✓ User is verified after admin manual verification")
    
    def test_admin_resend_otp(self):
        """Test admin can resend OTP to user"""
        # First register a test user
        test_email = f"test_admin_resend_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        user_id = reg_response.json()["user"]["id"]
        
        # Get admin token
        admin_token = self.get_admin_token()
        assert admin_token, "Failed to get admin token"
        
        # Admin resends OTP
        resend_response = self.session.post(
            f"{BASE_URL}/api/admin/users/{user_id}/resend-otp",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        
        assert resend_response.status_code == 200, f"Admin resend OTP failed: {resend_response.text}"
        print(f"✓ Admin can resend OTP to user")
    
    def test_admin_endpoints_require_admin_role(self):
        """Test that admin endpoints require admin role"""
        # Register a regular user
        test_email = f"test_regular_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": self.test_password,
            "name": self.test_name
        })
        assert reg_response.status_code == 200
        user_token = reg_response.json()["token"]
        user_id = reg_response.json()["user"]["id"]
        
        # Try to access admin customers endpoint
        response = self.session.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403, "Regular user should not access admin endpoints"
        print(f"✓ Admin endpoints require admin role")
    
    # ==================== SETTINGS TESTS ====================
    
    def test_admin_settings_has_firebase_config(self):
        """Test that admin settings include Firebase email configuration"""
        admin_token = self.get_admin_token()
        assert admin_token, "Failed to get admin token"
        
        response = self.session.get(
            f"{BASE_URL}/api/settings/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check Firebase settings exist
        assert "firebase_enabled" in data, "firebase_enabled setting missing"
        assert "firebase_api_key" in data or data.get("firebase_api_key") is not None or "firebase_api_key" in str(data), "firebase_api_key setting missing"
        print(f"✓ Admin settings include Firebase email configuration")


class TestOTPVerificationEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_email = "admin@gpgt.ae"
        self.admin_password = "admin123"
    
    def get_admin_token(self):
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_already_verified_user_cannot_verify_again(self):
        """Test that already verified user gets appropriate response"""
        # Register and manually verify a user
        test_email = f"test_already_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert reg_response.status_code == 200
        user_token = reg_response.json()["token"]
        user_id = reg_response.json()["user"]["id"]
        
        # Admin verifies the user
        admin_token = self.get_admin_token()
        self.session.post(
            f"{BASE_URL}/api/admin/users/{user_id}/verify-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        
        # Try to verify again
        verify_response = self.session.post(
            f"{BASE_URL}/api/auth/verify-email",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"otp": "123456"}
        )
        
        # Should return success with "already verified" message
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert "already" in data.get("message", "").lower() or data.get("email_verified") == True
        print(f"✓ Already verified user gets appropriate response")
    
    def test_resend_otp_for_verified_user_fails(self):
        """Test that resend OTP fails for already verified user"""
        # Register and manually verify a user
        test_email = f"test_resend_verified_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert reg_response.status_code == 200
        user_token = reg_response.json()["token"]
        user_id = reg_response.json()["user"]["id"]
        
        # Admin verifies the user
        admin_token = self.get_admin_token()
        self.session.post(
            f"{BASE_URL}/api/admin/users/{user_id}/verify-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        
        # Try to resend OTP
        resend_response = self.session.post(
            f"{BASE_URL}/api/auth/resend-email-otp",
            headers={"Authorization": f"Bearer {user_token}"},
            json={}
        )
        
        assert resend_response.status_code == 400, "Should fail for verified user"
        print(f"✓ Resend OTP fails for already verified user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
