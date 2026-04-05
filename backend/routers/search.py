"""
Search Router - Multi-database literature search via MCP skills
"""

import uuid
import asyncio
from fastapi import APIRouter, BackgroundTasks
from models import SearchRequest, SearchResult

router = APIRouter()

# In-memory job store (replace with Redis in production)
search_jobs = {}


async def _run_search(job_id: str, request: SearchRequest):
    """Background task: runs literature-review skill across databases"""
    search_jobs[job_id] = {"status": "running", "progress": 0, "results": None}
    try:
        # This is where Antigravity orchestrates the literature-review skill
        # Each database is queried concurrently
        db_names = [db.value for db in request.databases]
        search_jobs[job_id]["progress"] = 50
        
        # Placeholder result - real implementation calls the MCP skill
        result = SearchResult(
            query_id=job_id,
            total_found=0,
            after_deduplication=0,
            articles=[],
            databases_searched=request.databases
        )
        search_jobs[job_id] = {
            "status": "completed",
            "progress": 100,
            "results": result.model_dump(mode='json')
        }
    except Exception as e:
        search_jobs[job_id] = {"status": "failed", "error": str(e)}


@router.post("/start")
async def start_search(request: SearchRequest, background_tasks: BackgroundTasks):
    """Launch an asynchronous multi-database search"""
    job_id = str(uuid.uuid4())
    background_tasks.add_task(_run_search, job_id, request)
    return {
        "job_id": job_id,
        "status": "started",
        "databases": [db.value for db in request.databases],
        "message": f"Searching in {len(request.databases)} databases..."
    }


@router.get("/status/{job_id}")
async def get_search_status(job_id: str):
    """Poll search job status"""
    if job_id not in search_jobs:
        return {"status": "not_found"}
    return search_jobs[job_id]


@router.get("/results/{job_id}")
async def get_results(job_id: str):
    """Retrieve completed search results"""
    if job_id not in search_jobs:
        return {"error": "Job not found"}
    job = search_jobs[job_id]
    if job.get("status") != "completed":
        return {"error": "Search not completed yet", "status": job.get("status")}
    return job["results"]
