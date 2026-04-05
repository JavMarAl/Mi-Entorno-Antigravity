"""
Pydantic Data Models for Metaanalista
Strict typing for all scientific data structures
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ── PICO Framework ──────────────────────────────────────────────────────────

class PICOQuery(BaseModel):
    """Structured research question using PICO framework"""
    population: str = Field(..., description="Patient/Problem population")
    intervention: str = Field(..., description="Intervention being studied")
    comparison: Optional[str] = Field(None, description="Comparison/control")
    outcome: str = Field(..., description="Expected outcomes to measure")
    mesh_terms: List[str] = Field(default_factory=list, description="MeSH terms")
    study_types: List[str] = Field(
        default=["RCT", "systematic_review", "observational"],
        description="Types of studies to include"
    )
    date_range: Optional[dict] = Field(
        default={"start": "2015-01-01", "end": "2025-12-31"},
        description="Publication date range"
    )


class PICOTemplate(BaseModel):
    """Predefined PICO template for common research areas"""
    name: str
    area: Literal["primary_care", "microbiology", "pharmacology", "surgery", "custom"]
    description: str
    pico: PICOQuery


# ── Literature Search ────────────────────────────────────────────────────────

class SearchDatabase(str, Enum):
    PUBMED = "pubmed"
    BIORXIV = "biorxiv"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    OPENALEX = "openalex"
    COCHRANE = "cochrane"


class SearchRequest(BaseModel):
    """Multi-database search request"""
    pico: PICOQuery
    databases: List[SearchDatabase] = Field(
        default=[SearchDatabase.PUBMED, SearchDatabase.BIORXIV, SearchDatabase.SEMANTIC_SCHOLAR]
    )
    max_results_per_db: int = Field(default=100, ge=10, le=1000)
    effort_level: Literal["fast", "standard", "deep"] = Field(default="standard")


class Article(BaseModel):
    """Academic article record"""
    id: str
    title: str
    authors: List[str]
    abstract: Optional[str] = None
    doi: Optional[str] = None
    pmid: Optional[str] = None
    url: Optional[str] = None
    year: Optional[int] = None
    journal: Optional[str] = None
    database_source: SearchDatabase
    citation_count: Optional[int] = None
    is_preprint: bool = False


class SearchResult(BaseModel):
    """Aggregated results from multi-database search"""
    query_id: str
    total_found: int
    after_deduplication: int
    articles: List[Article]
    search_date: datetime = Field(default_factory=datetime.utcnow)
    databases_searched: List[SearchDatabase]


# ── Screening / PRISMA ───────────────────────────────────────────────────────

class ScreeningDecision(str, Enum):
    INCLUDE = "include"
    EXCLUDE = "exclude"
    UNCERTAIN = "uncertain"


class ScreeningRecord(BaseModel):
    """User decision on a single article"""
    article_id: str
    decision: ScreeningDecision
    reason: Optional[str] = None
    screened_at: datetime = Field(default_factory=datetime.utcnow)


class PRISMAFlow(BaseModel):
    """Data for PRISMA flow diagram generation"""
    identified: int = Field(..., description="Total identified from databases")
    duplicates_removed: int
    after_deduplication: int
    title_excluded: int
    abstract_excluded: int
    fulltext_assessed: int
    fulltext_excluded: int
    fulltext_exclusion_reasons: dict = Field(default_factory=dict)
    included: int
    project_id: str


# ── Quality Assessment ───────────────────────────────────────────────────────

class CochraneRoB(BaseModel):
    """Cochrane Risk of Bias tool for RCTs"""
    article_id: str
    random_sequence: Literal["low", "high", "unclear"]
    allocation_concealment: Literal["low", "high", "unclear"]
    blinding_participants: Literal["low", "high", "unclear"]
    blinding_outcome: Literal["low", "high", "unclear"]
    incomplete_outcome_data: Literal["low", "high", "unclear"]
    selective_reporting: Literal["low", "high", "unclear"]
    other_bias: Literal["low", "high", "unclear"]
    overall_risk: Literal["low", "high", "unclear"]
    comments: Optional[str] = None


class NewcastleOttawa(BaseModel):
    """Newcastle-Ottawa Scale for observational studies"""
    article_id: str
    study_type: Literal["cohort", "case_control"]
    selection_score: int = Field(..., ge=0, le=4)
    comparability_score: int = Field(..., ge=0, le=2)
    outcome_score: int = Field(..., ge=0, le=3)
    total_score: int = Field(..., ge=0, le=9)

    @property
    def quality_rating(self) -> str:
        if self.total_score >= 7:
            return "high"
        elif self.total_score >= 4:
            return "moderate"
        return "low"


# ── Publications ─────────────────────────────────────────────────────────────

class CitationStyle(str, Enum):
    VANCOUVER = "vancouver"
    APA = "apa"
    NATURE = "nature"
    CHICAGO = "chicago"
    IEEE = "ieee"


class ExportRequest(BaseModel):
    """Request for final manuscript export"""
    project_id: str
    citation_style: CitationStyle = CitationStyle.VANCOUVER
    include_prisma_diagram: bool = True
    include_risk_of_bias: bool = True
    format: Literal["pdf", "docx", "markdown"] = "pdf"


class VerificationResult(BaseModel):
    """DOI verification result from verify_citations.py"""
    doi: str
    is_valid: bool
    resolved_title: Optional[str] = None
    resolved_authors: Optional[List[str]] = None
    crossref_metadata: Optional[dict] = None
    error: Optional[str] = None
