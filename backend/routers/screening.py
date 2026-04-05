import subprocess
from pathlib import Path
from fastapi import APIRouter
from models import ScreeningRecord, PRISMAFlow
from database import add_screening_record, load_projects

router = APIRouter()

SKILLS_DIR = Path(__file__).parents[2] / "skills"

@router.post("/decision/{project_id}")
async def record_decision(project_id: str, record: ScreeningRecord):
    """Record include/exclude decision for an article"""
    add_screening_record(project_id, record.model_dump(mode='json'))
    return {"status": "recorded", "project_id": project_id, "article_id": record.article_id}


@router.get("/summary/{project_id}")
async def get_screening_summary(project_id: str):
    """Get current inclusion/exclusion counts"""
    project = load_projects().get(project_id, {})
    records = project.get("screening", [])
    included = sum(1 for r in records if r["decision"] == "include")
    excluded = sum(1 for r in records if r["decision"] == "exclude")
    uncertain = sum(1 for r in records if r["decision"] == "uncertain")
    return {
        "project_id": project_id,
        "total_screened": len(records),
        "included": included,
        "excluded": excluded,
        "uncertain": uncertain
    }


@router.post("/prisma/generate")
async def generate_prisma(flow: PRISMAFlow):
    """
    Invoke scientific-schematics skill to generate PRISMA flow diagram.
    Calls: scripts/generate_schematic.py with PRISMA description
    """
    output_dir = Path("output") / "prisma"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"prisma_{flow.project_id}.png"

    prisma_description = (
        f"PRISMA 2020 flow diagram for systematic review. "
        f"Records identified: n={flow.identified}. "
        f"Duplicates removed: n={flow.duplicates_removed}. "
        f"Records after deduplication: n={flow.after_deduplication}. "
        f"Records excluded by title: n={flow.title_excluded}. "
        f"Records excluded by abstract: n={flow.abstract_excluded}. "
        f"Full-texts assessed: n={flow.fulltext_assessed}. "
        f"Full-texts excluded: n={flow.fulltext_excluded}. "
        f"Studies included in synthesis: n={flow.included}. "
        f"Use official PRISMA 2020 style, blue boxes, clean professional layout."
    )

    schematic_script = SKILLS_DIR / "scientific-schematics" / "scripts" / "generate_schematic.py"

    try:
        result = subprocess.run(
            ["python", str(schematic_script), prisma_description, "-o", str(output_path), "--doc-type", "journal"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            return {"status": "generated", "path": str(output_path), "project_id": flow.project_id}
        else:
            return {"status": "error", "stderr": result.stderr}
    except FileNotFoundError:
        return {"status": "skill_not_configured", "message": "scientific-schematics skill script not found"}
    except subprocess.TimeoutExpired:
        return {"status": "timeout", "message": "PRISMA generation timed out"}
