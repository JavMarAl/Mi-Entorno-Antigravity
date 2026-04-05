"""
Publications Router - Citation verification and PDF export
"""

import subprocess
from pathlib import Path
from fastapi import APIRouter
from models import ExportRequest, VerificationResult, CitationStyle

router = APIRouter()

SKILLS_DIR = Path(__file__).parents[2] / "skills"


@router.post("/verify-doi")
async def verify_doi(doi: str):
    """
    Verify DOI using the literature-review skill's verify_citations.py
    """
    verify_script = SKILLS_DIR / "literature-review" / "scripts" / "verify_citations.py"
    try:
        result = subprocess.run(
            ["python", str(verify_script), "--doi", doi],
            capture_output=True, text=True, timeout=30
        )
        is_valid = result.returncode == 0
        return VerificationResult(
            doi=doi,
            is_valid=is_valid,
            error=result.stderr if not is_valid else None
        ).model_dump(mode='json')
    except FileNotFoundError:
        return {"doi": doi, "is_valid": False, "error": "verify_citations.py not found"}


@router.post("/export")
async def export_manuscript(request: ExportRequest):
    """
    Generate final PDF manuscript using literature-review skill's generate_pdf.py
    Citation styles: Vancouver, APA, Nature, Chicago, IEEE
    """
    output_dir = Path("output") / "manuscripts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"metaanalysis_{request.project_id}.{request.format}"

    generate_script = SKILLS_DIR / "literature-review" / "scripts" / "generate_pdf.py"

    citation_map = {
        CitationStyle.VANCOUVER: "vancouver",
        CitationStyle.APA: "apa",
        CitationStyle.NATURE: "nature",
        CitationStyle.CHICAGO: "chicago",
        CitationStyle.IEEE: "ieee",
    }

    try:
        result = subprocess.run(
            [
                "python", str(generate_script),
                f"data/drafts/{request.project_id}.md",
                "--citation-style", citation_map[request.citation_style],
                "--output", str(output_path)
            ],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            return {
                "status": "generated",
                "output_path": str(output_path),
                "citation_style": request.citation_style,
                "format": request.format
            }
        else:
            return {"status": "error", "stderr": result.stderr}
    except FileNotFoundError:
        return {"status": "skill_not_configured", "message": "generate_pdf.py not found"}


@router.get("/citation-styles")
async def get_citation_styles():
    """List available citation formatting styles"""
    return {
        "styles": [
            {"id": "vancouver", "name": "Vancouver", "description": "Standard for biomedical journals"},
            {"id": "apa", "name": "APA 7th Ed.", "description": "American Psychological Association"},
            {"id": "nature", "name": "Nature", "description": "Nature Publishing Group style"},
            {"id": "chicago", "name": "Chicago", "description": "Chicago Manual of Style"},
            {"id": "ieee", "name": "IEEE", "description": "Institute of Electrical and Electronics Engineers"},
        ]
    }
