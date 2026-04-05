import requests
import json

base_url = "http://localhost:8000"

def test_pico():
    print("Testing PICO extraction...")
    payload = {
        "text": "P: Patients with hypertension, I: Dash diet, C: Regular diet, O: Blood pressure reduction"
    }
    response = requests.post(f"{base_url}/api/pico/parse", json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_pico()
