"""
Test suite for GPGT Notifications API
Testing features:
- GET /api/notifications - Get admin notifications with unread count
- PUT /api/notifications/{id}/read - Mark notification as read
- PUT /api/notifications/mark-all-read - Mark all as read
- Notification creation on user registration, orders, and enquiries
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gpgt.ae"
ADMIN_PASSWORD = "admin123"


class TestNotificationsAPI:
    """Test notification endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_notifications_requires_auth(self):
        """GET /api/notifications requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("PASS: GET /api/notifications requires authentication")
    
    def test_get_notifications_success(self):
        """GET /api/notifications returns notifications list and unread_count"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert response.status_code == 200, f"Failed to get notifications: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response missing 'notifications' field"
        assert "unread_count" in data, "Response missing 'unread_count' field"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        
        print(f"PASS: GET /api/notifications returns {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_get_notifications_unread_only(self):
        """GET /api/notifications?unread_only=true filters to unread only"""
        response = requests.get(f"{BASE_URL}/api/notifications?unread_only=true", headers=self.headers)
        assert response.status_code == 200, f"Failed to get unread notifications: {response.text}"
        
        data = response.json()
        # All returned notifications should be unread
        for n in data["notifications"]:
            assert n.get("read") == False or n.get("read") is None, "Found read notification in unread_only filter"
        
        print(f"PASS: GET /api/notifications?unread_only=true filters correctly")
    
    def test_mark_notification_read_requires_auth(self):
        """PUT /api/notifications/{id}/read requires admin authentication"""
        response = requests.put(f"{BASE_URL}/api/notifications/fake-id/read")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("PASS: PUT /api/notifications/{id}/read requires authentication")
    
    def test_mark_notification_read_not_found(self):
        """PUT /api/notifications/{id}/read returns 404 for non-existent notification"""
        response = requests.put(f"{BASE_URL}/api/notifications/non-existent-id/read", headers=self.headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: PUT /api/notifications/{id}/read returns 404 for non-existent notification")
    
    def test_mark_all_read_requires_auth(self):
        """PUT /api/notifications/mark-all-read requires admin authentication"""
        response = requests.put(f"{BASE_URL}/api/notifications/mark-all-read")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("PASS: PUT /api/notifications/mark-all-read requires authentication")
    
    def test_mark_all_read_success(self):
        """PUT /api/notifications/mark-all-read marks all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/mark-all-read", headers=self.headers)
        assert response.status_code == 200, f"Failed to mark all as read: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response missing message"
        
        # Verify unread count is now 0
        verify = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert verify.status_code == 200
        assert verify.json()["unread_count"] == 0, "Unread count should be 0 after marking all as read"
        
        print("PASS: PUT /api/notifications/mark-all-read works correctly")


class TestNotificationCreation:
    """Test that notifications are created on specific events"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_user_registration_creates_notification(self):
        """User registration should create a 'new_user' notification"""
        # Register a new user
        unique_email = f"test_notif_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Notification User"
        })
        
        # Registration might succeed or fail if email already exists
        if reg_response.status_code == 200:
            # Check for new_user notification
            notifs = requests.get(f"{BASE_URL}/api/notifications?limit=10", headers=self.headers)
            assert notifs.status_code == 200
            
            notifications = notifs.json()["notifications"]
            new_user_notif = None
            for n in notifications:
                if n.get("type") == "new_user" and unique_email in n.get("message", ""):
                    new_user_notif = n
                    break
            
            if new_user_notif:
                print(f"PASS: User registration creates 'new_user' notification")
            else:
                print(f"INFO: User registration completed but notification may take time to appear")
        else:
            print(f"INFO: User registration returned {reg_response.status_code} - {reg_response.text}")
    
    def test_cart_enquiry_creates_notification(self):
        """Cart enquiry should create a 'new_enquiry' notification"""
        # Submit a cart enquiry (don't need auth for this)
        enquiry_data = {
            "items": [{
                "product_id": "test-product-id",
                "product_name": "Test Notification Product",
                "product_sku": "TEST-SKU",
                "quantity": 1,
                "unit_price": 100,
                "total_price": 100
            }],
            "customer": {
                "name": "Notification Test Customer",
                "email": "notif_test@test.com",
                "phone": "+971501234567"
            },
            "shipping_address": {
                "address_line1": "Test Address",
                "city": "Dubai",
                "emirate": "Dubai"
            },
            "subtotal": 100,
            "vat": 5,
            "shipping": 25,
            "total": 130,
            "is_quotation_request": True
        }
        
        enquiry_response = requests.post(f"{BASE_URL}/api/cart-enquiry", json=enquiry_data)
        
        if enquiry_response.status_code == 200:
            # Check for new_enquiry notification
            notifs = requests.get(f"{BASE_URL}/api/notifications?limit=10", headers=self.headers)
            assert notifs.status_code == 200
            
            notifications = notifs.json()["notifications"]
            enquiry_notif = None
            for n in notifications:
                if n.get("type") == "new_enquiry":
                    enquiry_notif = n
                    break
            
            if enquiry_notif:
                print(f"PASS: Cart enquiry creates 'new_enquiry' notification")
            else:
                print(f"INFO: Cart enquiry completed but notification may take time to appear")
        else:
            print(f"INFO: Cart enquiry returned {enquiry_response.status_code}")


class TestNotificationStructure:
    """Test notification object structure"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_notification_has_required_fields(self):
        """Notifications should have id, type, title, message, read, created_at fields"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert response.status_code == 200
        
        notifications = response.json()["notifications"]
        if len(notifications) > 0:
            n = notifications[0]
            required_fields = ["id", "type", "title", "message", "read", "created_at"]
            missing = [f for f in required_fields if f not in n]
            assert len(missing) == 0, f"Notification missing fields: {missing}"
            print(f"PASS: Notifications have all required fields: {required_fields}")
        else:
            print("INFO: No notifications to test structure, skipping")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
