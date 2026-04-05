"""
PICO Router - Handles research question structuring
"""

import uuid
from fastapi import APIRouter
from models import PICOQuery, PICOTemplate
from database import upsert_project
from utils.pico_extractor import extract_pico_from_text

router = APIRouter()

# Predefined templates for medical research areas
TEMPLATES = [
    PICOTemplate(
        name="Antibióticos en Atención Primaria",
        area="primary_care",
        description="Eficacia de antibióticos en infecciones respiratorias en AP",
        pico=PICOQuery(
            population="Adultos con infección respiratoria en AP",
            intervention="Antibioticoterapia empírica",
            comparison="Placebo o espera activa",
            outcome="Resolución clínica y resistencias bacterianas",
            mesh_terms=["Anti-Bacterial Agents", "Respiratory Tract Infections", "Primary Health Care"],
            study_types=["RCT", "systematic_review"]
        )
    ),
    PICOTemplate(
        name="Resistencia Antimicrobiana",
        area="microbiology",
        description="Patrones de resistencia en microbiología clínica hospitalaria",
        pico=PICOQuery(
            population="Pacientes hospitalizados con infección nosocomial",
            intervention="Cultivos y antibiograma guiado",
            comparison="Tratamiento empírico estándar",
            outcome="Tasa de curación y perfil de resistencias",
            mesh_terms=["Drug Resistance, Microbial", "Hospital-Acquired Infections", "Antibiogram"],
            study_types=["observational", "cohort"]
        )
    ),
]


@router.post("/parse")
async def parse_pico(query: dict):
    """Parse free-text question into PICO structure using AI"""
    query_id = str(uuid.uuid4())
    extracted_pico = extract_pico_from_text(query.get("text", ""))
    pico_data = {
        "query_id": query_id,
        "status": "parsed",
        "pico": extracted_pico
    }
    upsert_project(query_id, pico_data)
    return pico_data


@router.post("/structured")
async def create_pico(pico: PICOQuery):
    """Save a structured PICO query"""
    query_id = str(uuid.uuid4())
    pico_data = {
        "query_id": query_id,
        "status": "saved",
        "pico": pico.model_dump(mode='json')
    }
    upsert_project(query_id, pico_data)
    return pico_data


@router.get("/templates")
async def get_templates():
    """Return predefined PICO templates"""
    return {"templates": [t.model_dump() for t in TEMPLATES]}
