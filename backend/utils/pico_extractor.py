import re
from typing import Dict, List

def extract_pico_from_text(text: str) -> Dict[str, any]:
    """
    Extracts PICO components from a free-text research question.
    Uses pattern matching as a robust fallback for structured text.
    In a production scenario, this would call an LLM.
    """
    # Initialize structure
    pico = {
        "population": "",
        "intervention": "",
        "comparison": "",
        "outcome": "",
        "mesh_terms": []
    }
    
    # Try to find explicit labels
    patterns = {
        "population": [r"P:\s*(.*?)(?=[ICO]:|$)", r"Population:\s*(.*?)(?=[ICO]:|$)"],
        "intervention": [r"I:\s*(.*?)(?=[PCO]:|$)", r"Intervention:\s*(.*?)(?=[PCO]:|$)"],
        "comparison": [r"C:\s*(.*?)(?=[PIO]:|$)", r"Comparison:\s*(.*?)(?=[PIO]:|$)"],
        "outcome": [r"O:\s*(.*?)(?=[PIC]:|$)", r"Outcome:\s*(.*?)(?=[PIC]:|$)"]
    }
    
    found_structured = False
    for key, p_list in patterns.items():
        for p in p_list:
            match = re.search(p, text, re.IGNORECASE | re.DOTALL)
            if match:
                pico[key] = match.group(1).strip()
                found_structured = True
                break
    
    # If no structured labels found, treat the whole text as population
    if not found_structured:
        pico["population"] = text.strip()
        
    return pico
