"""
Verification Script for Metaanalista Backend
Tests core API endpoints and persistence
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_pico():
    print("Testing PICO Parse...")
    resp = requests.post(f"{BASE_URL}/api/pico/parse", json={"text": "Eficacia de aspirina en prevención de ictus"})
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}\n")
    return resp.json().get("query_id")

def test_screening(project_id):
    print("Testing Screening Decision...")
    record = {
        "article_id": "PMC12345",
        "decision": "include",
        "reason": "Meets all PICO criteria",
        "notes": "Good sample size"
    }
    resp = requests.post(f"{BASE_URL}/api/screening/decision/{project_id}", json=record)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}\n")

def test_summary(project_id):
    print("Testing Project Summary...")
    resp = requests.get(f"{BASE_URL}/api/screening/summary/{project_id}")
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}\n")

if __name__ == "__main__":
    print("=== Metaanalista Backend Verification ===\n")
    try:
        pid = test_pico()
        if pid:
            test_screening(pid)
            test_summary(pid)
        print("Verification completed successfully.")
    except Exception as e:
        print(f"Verification failed: {e}")
        print("Make sure the FastAPI server is running (python backend/main.py)")
