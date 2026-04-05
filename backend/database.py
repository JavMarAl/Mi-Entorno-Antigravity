"""
Persistence Layer for Metaanalista
Handles JSON storage for projects and research data
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

DATA_DIR = Path("data")
PROJECTS_FILE = DATA_DIR / "projects.json"

def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not PROJECTS_FILE.exists():
        with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f)

def load_projects() -> Dict[str, Any]:
    init_db()
    with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_projects(projects: Dict[str, Any]):
    with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    return load_projects().get(project_id)

def upsert_project(project_id: str, data: Dict[str, Any]):
    projects = load_projects()
    projects[project_id] = {**projects.get(project_id, {}), **data}
    save_projects(projects)

def add_screening_record(project_id: str, record: Dict[str, Any]):
    projects = load_projects()
    if project_id not in projects:
        projects[project_id] = {"screening": []}
    if "screening" not in projects[project_id]:
        projects[project_id]["screening"] = []
    projects[project_id]["screening"].append(record)
    save_projects(projects)
