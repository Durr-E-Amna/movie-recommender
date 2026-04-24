"""
routes/recommendation.py
========================
GET  /api/recommendations – personalized hybrid recs
GET  /api/recommendations/metrics – model evaluation metrics
GET  /api/recommendations/history – recently watched
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Query, HTTPException

from backend.database import watch_history_col, recommendations_col
from backend.ml.recommender import engine
from backend.routes.auth import get_current_user

# Try to import poster helper (optional - won't break if missing)
try:
    from backend.utils.tmdb_helpers import get_poster_url
    POSTER_ENABLED = True
except ImportError:
    POSTER_ENABLED = False
    get_poster_url = lambda x: None

router = APIRouter()

METRICS_PATH = Path(__file__).resolve().parent.parent.parent / "evaluation" / "metrics.json"


# ─── Helper function to add poster URLs ───────────────────────────────────────

def add_poster_url(movie: dict) -> dict:
    """Add poster_url to movie dictionary if available"""
    if POSTER_ENABLED and movie and "movieId" in movie:
        movie["poster_url"] = get_poster_url(movie["movieId"])
    return movie


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_recommendations(
    limit:        int = Query(12, ge=1, le=30),
    current_user      = Depends(get_current_user),
):
    """
    Hybrid recommendations for the authenticated user.
    - Collaborative if the user has enough ratings
    - Content-based (cold-start) otherwise
    """
    user_id = str(current_user["_id"])

    # Fetch user's watch history from DB
    wh_col = watch_history_col()
    history_docs = (
        await wh_col.find({"userId": user_id})
                    .sort("watchedAt", -1)
                    .to_list(length=50)
    )
    watch_ids = [doc["movieId"] for doc in history_docs]

    # Convert string user_id to an int for the ML model (if possible)
    try:
        ml_user_id = int(user_id[-6:], 16)
    except Exception:
        ml_user_id = 0

    recs = engine.hybrid(
        user_id=ml_user_id,
        watch_history=watch_ids,
        n=limit,
    )

    # Add poster URLs to each recommendation
    recs = [add_poster_url(rec) for rec in recs]

    # Log recommendations to DB
    rc = recommendations_col()
    await rc.insert_one({
        "userId":    user_id,
        "recs":      [r["movieId"] for r in recs],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })

    return {"recommendations": recs, "count": len(recs)}


@router.get("/history")
async def recently_watched(
    limit:        int = Query(10, ge=1, le=50),
    current_user      = Depends(get_current_user),
):
    user_id  = str(current_user["_id"])
    wh_col   = watch_history_col()
    history  = (
        await wh_col.find({"userId": user_id})
                    .sort("watchedAt", -1)
                    .to_list(length=limit)
    )
    results = []
    for doc in history:
        movie = engine.get_movie_details(doc["movieId"])
        if movie:
            movie["watchedAt"] = doc.get("watchedAt", "")
            movie = add_poster_url(movie)
            results.append(movie)
    return {"history": results}


@router.get("/metrics")
async def model_metrics():
    """Return the latest model evaluation metrics."""
    if not METRICS_PATH.exists():
        raise HTTPException(
            404,
            "Metrics not found. Run `python backend/ml/train_model.py` first.",
        )
    with open(METRICS_PATH) as f:
        return json.load(f)