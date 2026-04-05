"""
Quality Assessment Router - Cochrane RoB and Newcastle-Ottawa Scale
"""

from fastapi import APIRouter
from models import CochraneRoB, NewcastleOttawa
from database import upsert_project, load_projects

router = APIRouter()

# Store quality assessments (use DB in production)
rob_assessments: dict = {}
nos_assessments: dict = {}


@router.post("/cochrane")
async def save_cochrane_rob(assessment: CochraneRoB):
    """Save Cochrane Risk of Bias assessment for an RCT"""
    projects = load_projects()
    # For now, we associate assessments with the article_id globally in the project
    # In a real app, you'd specify project_id too
    upsert_project("default_project", {"rob_assessments": {assessment.article_id: assessment.model_dump(mode='json')}})
    return {"status": "saved", "article_id": assessment.article_id, "overall_risk": assessment.overall_risk}


@router.get("/cochrane/{article_id}")
async def get_cochrane_rob(article_id: str):
    """Retrieve a Cochrane RoB assessment"""
    if article_id not in rob_assessments:
        return {"error": "Assessment not found"}
    return rob_assessments[article_id]


@router.post("/newcastle-ottawa")
async def save_nos(assessment: NewcastleOttawa):
    """Save Newcastle-Ottawa Scale assessment for observational study"""
    quality = "high" if assessment.total_score >= 7 else "moderate" if assessment.total_score >= 4 else "low"
    nos_assessments[assessment.article_id] = {**assessment.model_dump(), "quality_rating": quality}
    return {"status": "saved", "article_id": assessment.article_id, "quality_rating": quality}


@router.get("/summary/{project_id}")
async def quality_summary(project_id: str):
    """Aggregate quality summary for all articles in a project"""
    rob_counts = {"low": 0, "high": 0, "unclear": 0}
    for a in rob_assessments.values():
        rob_counts[a.get("overall_risk", "unclear")] += 1

    nos_counts = {"high": 0, "moderate": 0, "low": 0}
    for a in nos_assessments.values():
        nos_counts[a.get("quality_rating", "low")] += 1

    return {
        "project_id": project_id,
        "cochrane_rob": rob_counts,
        "newcastle_ottawa": nos_counts
    }
