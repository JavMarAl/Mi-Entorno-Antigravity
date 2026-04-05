import requests
import json
import time

base_url = "http://localhost:8000"

def test_full_workflow():
    print("=== STARTING FULL WORKFLOW TEST ===")
    
    # 1. Create/Parse PICO
    print("\n1. Parsing PICO question...")
    pico_payload = {"text": "P: Diabetic patients, I: Exercise, C: No exercise, O: Glucose levels"}
    r_pico = requests.post(f"{base_url}/api/pico/parse", json=pico_payload)
    project_id = r_pico.json().get("query_id")
    print(f"Project Created: {project_id}")

    # 2. Test Screening Decision
    # Correction: Path includes project_id, Article record excludes certainty-specific fields if not defined
    print("\n2. Testing Screening Decision (Include)...")
    screening_payload = {
        "article_id": "art_001",
        "decision": "include",
        "reason": "Meets all PICO criteria"
    }
    r_screen = requests.post(f"{base_url}/api/screening/decision/{project_id}", json=screening_payload)
    print(f"Screening Status: {r_screen.status_code}")
    print(r_screen.json())

    # 3. Test Quality Assessment (Cochrane RoB)
    print("\n3. Testing Quality Assessment (Cochrane)...")
    quality_payload = {
        "article_id": "art_001",
        "random_sequence": "low",
        "allocation_concealment": "low",
        "blinding_participants": "high",
        "blinding_outcome": "low",
        "incomplete_outcome_data": "low",
        "selective_reporting": "low",
        "other_bias": "low",
        "overall_risk": "low",
        "comments": "Open-label study"
    }
    r_quality = requests.post(f"{base_url}/api/quality/cochrane", json=quality_payload)
    print(f"Quality Status: {r_quality.status_code}")
    print(r_quality.json())

    # 4. Verify Project State (Summary)
    print("\n4. Verifying Project Summary...")
    r_summary = requests.get(f"{base_url}/api/screening/summary/{project_id}")
    print(f"Summary Status: {r_summary.status_code}")
    print(r_summary.json())

    print("\n=== WORKFLOW TEST COMPLETE ===")

if __name__ == "__main__":
    test_full_workflow()
