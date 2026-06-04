"""
main.py  –  FastAPI entry point
Run: uvicorn backend.main:app --reload --port 8000
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

# ── Load .env before any other import reads env vars ─────────────────────────
_env = Path(__file__).resolve().parent.parent / ".env"
if _env.exists():
    with open(_env) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _, _v = _line.partition("=")
                os.environ.setdefault(_k.strip(), _v.strip())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.ml.recommender import engine
from backend.routes import auth, movies, recommendation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    engine.load_models()
    yield


app = FastAPI(
    title="CineAI – Movie Recommendation API",
    description="Hybrid AI-powered movie recommendation system",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,https://movie-recommender-kno7.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router,           prefix="/api/auth",            tags=["Auth"])
app.include_router(movies.router,         prefix="/api/movies",          tags=["Movies"])
app.include_router(recommendation.router, prefix="/api/recommendations", tags=["Recommendations"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "CineAI API is running 🎬"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "models_loaded": engine._loaded}
