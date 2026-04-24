"""
routes/auth.py
==============
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
"""

import os
import time
from datetime import datetime, timedelta, timezone
from typing import List

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from backend.database import users_col

router   = APIRouter()
security = HTTPBearer()

SECRET_KEY      = os.getenv("JWT_SECRET", "change-me-in-production-please")
ALGORITHM       = "HS256"
TOKEN_EXPIRE_H  = 24 * 7  # 7 days


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username:       str
    email:          EmailStr
    password:       str
    favoriteGenres: List[str] = []


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_H),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(creds.credentials)
    user_id = payload.get("sub")
    col  = users_col()
    user = await col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def serialize_user(user: dict) -> dict:
    return {
        "id":             str(user["_id"]),
        "username":       user["username"],
        "email":          user["email"],
        "favoriteGenres": user.get("favoriteGenres", []),
        "createdAt":      user.get("createdAt", ""),
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    col = users_col()

    # Uniqueness checks
    if await col.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    if await col.find_one({"username": body.username}):
        raise HTTPException(400, "Username already taken")

    doc = {
        "username":       body.username,
        "email":          body.email,
        "passwordHash":   hash_password(body.password),
        "favoriteGenres": body.favoriteGenres,
        "watchHistory":   [],
        "createdAt":      datetime.now(timezone.utc).isoformat(),
    }
    result = await col.insert_one(doc)
    token  = create_token(str(result.inserted_id))

    doc["_id"] = result.inserted_id
    return {"token": token, "user": serialize_user(doc)}


@router.post("/login")
async def login(body: LoginRequest):
    col  = users_col()
    user = await col.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_token(str(user["_id"]))
    return {"token": token, "user": serialize_user(user)}


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.patch("/genres")
async def update_genres(
    body: dict,
    current_user=Depends(get_current_user),
):
    genres = body.get("favoriteGenres", [])
    await users_col().update_one(
        {"_id": current_user["_id"]},
        {"$set": {"favoriteGenres": genres}},
    )
    return {"favoriteGenres": genres}
