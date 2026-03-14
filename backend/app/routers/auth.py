from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import audit_col, users_col
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.utils.id_utils import doc_to_dict
import time

router = APIRouter(prefix="/auth", tags=["auth"])


def _safe_user(user: dict) -> dict:
    u = doc_to_dict(user)
    u.pop("hashed_password", None)
    return u


async def _write_audit(user_id: str, email: str, action: str):
    await audit_col().insert_one({
        "user_id": user_id,
        "user": email,
        "action": action,
        "detail": f"Auth event: {action}",
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })


@router.post("/register", status_code=201)
async def register(body: RegisterRequest):
    existing = await users_col().find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "org_role": "admin" if "admin" in body.email.lower() else "user",
        "status": "Active",
        "custom_status": "",
        "created_at": int(time.time() * 1000),
    }
    result = await users_col().insert_one(doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id})
    doc["_id"] = result.inserted_id
    await _write_audit(user_id, body.email, "register")
    return {"token": token, "user": _safe_user(doc)}


@router.post("/login")
async def login(body: LoginRequest):
    user = await users_col().find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})
    await _write_audit(user_id, body.email, "login")
    return {"token": token, "user": _safe_user(user)}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _safe_user(current_user)


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await _write_audit(current_user["id"], current_user["email"], "logout")
    return {"ok": True}
