"""
database.py
===========
MongoDB connection and collection helpers using Motor (async driver).
"""

import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

# ─── Load .env explicitly (no extra dependency needed) ───────────────────────
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

# Supports both MONGODB_URI and MONGO_URI in .env
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "cineai")

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI)
    return _client


def get_db():
    return get_client()[DB_NAME]


# ─── Collections ──────────────────────────────────────────────────────────────

def users_col():
    return get_db()["users"]

def ratings_col():
    return get_db()["ratings"]

def watch_history_col():
    return get_db()["watchHistory"]

def recommendations_col():
    return get_db()["recommendations"]


# ─── Index creation (call once on startup or migration) ───────────────────────

async def create_indexes():
    db = get_db()

    # users
    await db["users"].create_index([("email", ASCENDING)], unique=True)
    await db["users"].create_index([("username", ASCENDING)], unique=True)

    # ratings
    await db["ratings"].create_index([("userId", ASCENDING)])
    await db["ratings"].create_index([("movieId", ASCENDING)])
    await db["ratings"].create_index([("userId", ASCENDING), ("movieId", ASCENDING)], unique=True)

    # watchHistory
    await db["watchHistory"].create_index([("userId", ASCENDING)])
    await db["watchHistory"].create_index([("watchedAt", DESCENDING)])

    # recommendations log
    await db["recommendations"].create_index([("userId", ASCENDING)])
    await db["recommendations"].create_index([("createdAt", DESCENDING)])
