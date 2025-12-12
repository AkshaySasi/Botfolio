import requests
import uuid

API_URL = "http://127.0.0.1:8000"

def test_health():
    try:
        r = requests.get(f"{API_URL}/api/health")
        print(f"Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_register():
    unique_email = f"test_{uuid.uuid4()}@example.com"
    payload = {
        "email": unique_email,
        "password": "password123",
        "name": "API Tester"
    }
    try:
        r = requests.post(f"{API_URL}/api/auth/register", json=payload)
        if r.status_code == 200:
            print(f"Registration: SUCCESS - {unique_email}")
            print(f"Response: {r.json().keys()}")
        else:
            print(f"Registration: FAILED ({r.status_code}) - {r.text}")
    except Exception as e:
        print(f"Registration Request Failed: {e}")

if __name__ == "__main__":
    test_health()
    test_register()
