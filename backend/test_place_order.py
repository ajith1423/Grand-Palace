
import requests
import json
import uuid

API_URL = "http://127.0.0.1:8000/api"

def place_order():
    url = f"{API_URL}/orders"
    payload = {
        "items": [
            {
                "product_id": "8f49c3b9-7cc1-4a30-9a28-1ae3ca5cffc2",
                "quantity": 1
            }
        ],
        "shipping_address": {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "0501234567",
            "address_line1": "Test Address 1",
            "city": "Dubai",
            "emirate": "Dubai",
            "country": "UAE"
        },
        "payment_method": "cod",
        "notes": "Testing order insertion"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Placing order to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        pprint_json = json.dumps(response.json(), indent=2)
        print(pprint_json)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    place_order()
