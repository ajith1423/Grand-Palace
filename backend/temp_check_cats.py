import requests
import json

def check_live_api():
    # Use the public 'categories' endpoint which also should have the 1000 limit now
    url = 'http://127.0.0.1:8001/api/categories/all'
    print(f"Checking URL: {url}")
    try:
        # We need a token because get_all_categories is protected
        # But wait, for verification, I just want to see if the server is ALIVE and reachable on 8001
        res = requests.get('http://127.0.0.1:8001/api/categories')
        print(f"Status Code for public categories: {res.status_code}")
        data = res.json()
        if isinstance(data, list):
            print(f"API result: {len(data)} main categories")
            # If "test" is a main category, it should be in there IF it's active.
            names = [c.get('name') for c in data]
            print(f"Main category names: {names[:10]}")
            if 'test' in names:
                print("SUCCESS: 'test' found in main categories!")
            else:
                print("FAILURE: 'test' NOT found in main categories.")
        else:
            print(f"Data: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_live_api()
