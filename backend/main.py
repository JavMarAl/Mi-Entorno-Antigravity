"""
Metaanalista Backend - Main FastAPI Application
Orchestrates scientific skills via Antigravity
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

from routers import pico, search, screening, quality, publications

app = FastAPI(
    title="Metaanalista API",
    description="Backend for systematic review and meta-analysis automation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(pico.router, prefix="/api/pico", tags=["PICO"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(screening.router, prefix="/api/screening", tags=["Screening"])
app.include_router(quality.router, prefix="/api/quality", tags=["Quality"])
app.include_router(publications.router, prefix="/api/publications", tags=["Publications"])


@app.get("/")
async def root():
    return {"status": "ok", "app": "Metaanalista", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
