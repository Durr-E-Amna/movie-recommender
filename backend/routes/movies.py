"""
routes/movies.py
================
GET  /api/movies – paginated list with optional genre filter
GET  /api/movies/search – search by title
GET  /api/movies/top-rated – top rated (from ratings collection)
GET  /api/movies/{id} – single movie details
POST /api/movies/{id}/rate – submit a rating
GET  /api/movies/{id}/similar – content-based similar movies
"""

from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.database import ratings_col, watch_history_col
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


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RateRequest(BaseModel):
    rating: float   # 0.5 – 5.0


# ─── Helper function to add poster URLs ───────────────────────────────────────

def add_poster_url(movie: dict) -> dict:
    """Add poster_url to movie dictionary if available"""
    if POSTER_ENABLED and movie and "movieId" in movie:
        movie["poster_url"] = get_poster_url(movie["movieId"])
    return movie


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def list_movies(
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),
    genre: str = Query(""),
):
    result = engine.get_all_movies(page=page, limit=limit, genre=genre)
    # Add poster URLs to each movie
    result["movies"] = [add_poster_url(movie) for movie in result["movies"]]
    return result


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    results = engine.search_movies(q)
    results = [add_poster_url(movie) for movie in results]
    return {"results": results, "count": len(results)}


@router.get("/top-rated")
async def top_rated(limit: int = Query(20, ge=1, le=50)):
    """
    Aggregate average rating per movie from the DB ratings collection.
    Falls back to returning popular movies if no ratings are recorded yet.
    """
    col = ratings_col()
    pipeline = [
        {"$group": {
            "_id":    "$movieId",
            "avgRating": {"$avg": "$rating"},
            "count":     {"$sum": 1},
        }},
        {"$match": {"count": {"$gte": 1}}},
        {"$sort": {"avgRating": -1}},
        {"$limit": limit},
    ]
    docs = await col.aggregate(pipeline).to_list(length=limit)

    results = []
    for doc in docs:
        details = engine.get_movie_details(doc["_id"])
        if details:
            details["avgRating"] = round(doc["avgRating"], 2)
            details["ratingCount"] = doc["count"]
            details = add_poster_url(details)
            results.append(details)

    # Fallback: no DB ratings yet – return first N movies
    if not results:
        data = engine.get_all_movies(page=1, limit=limit)
        results = [add_poster_url(movie) for movie in data["movies"]]

    return {"movies": results}


@router.get("/{movie_id}")
async def get_movie(movie_id: int):
    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(404, "Movie not found")

    # Fetch average rating from DB
    col = ratings_col()
    pipeline = [
        {"$match": {"movieId": movie_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = await col.aggregate(pipeline).to_list(1)
    if agg:
        movie["avgRating"]   = round(agg[0]["avg"], 2)
        movie["ratingCount"] = agg[0]["count"]

    # Add poster URL
    movie = add_poster_url(movie)
    
    return movie


@router.post("/{movie_id}/rate")
async def rate_movie(
    movie_id:     int,
    body:         RateRequest,
    current_user = Depends(get_current_user),
):
    if not (0.5 <= body.rating <= 5.0):
        raise HTTPException(400, "Rating must be between 0.5 and 5.0")

    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(404, "Movie not found")

    user_id = str(current_user["_id"])
    col     = ratings_col()

    # Upsert rating
    await col.update_one(
        {"userId": user_id, "movieId": movie_id},
        {"$set": {
            "userId":    user_id,
            "movieId":   movie_id,
            "rating":    body.rating,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    # Log to watch history
    wh = watch_history_col()
    await wh.update_one(
        {"userId": user_id, "movieId": movie_id},
        {"$set": {
            "userId":    user_id,
            "movieId":   movie_id,
            "title":     movie["title"],
            "genres":    movie["genres"],
            "tmdbId":    movie.get("tmdbId"),
            "watchedAt": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return {"message": "Rating saved", "rating": body.rating}


@router.get("/{movie_id}/similar")
async def similar_movies(movie_id: int, limit: int = Query(10, ge=1, le=30)):
    movie = engine.get_movie_details(movie_id)
    if not movie:
        raise HTTPException(404, "Movie not found")
    recs = engine.content_based(movie_id, n=limit)
    recs = [add_poster_url(rec) for rec in recs]
    return {"similar": recs}