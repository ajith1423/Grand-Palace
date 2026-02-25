
import requests
import json

API_URL = "http://127.0.0.1:8000/api"

def check_all_orders():
    url = f"{API_URL}/orders/all"
    headers = {
        "Authorization": "Bearer YOUR_TOKEN_HERE" # Need to get a token if it's protected
    }
    
    # Let's try it without auth first just to see if it's open or if we get 401
    print(f"Fetching from {url}...")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            print(f"Returned {len(orders)} orders.")
            for o in orders[:5]:
                print(f" - {o.get('order_number')} | {o.get('customer_email')} | {o.get('created_at')}")
        else:
            print(f"Failed: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_all_orders()
