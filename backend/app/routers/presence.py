import time

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.db.mongo import users_col
from app.schemas.schemas import PresenceUpdate
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/presence", tags=["presence"])


@router.get("/")
async def get_all_presences(current_user: dict = Depends(get_current_user)):
    cursor = users_col().find({"org_id": current_user["org_id"]}, {"_id": 1, "name": 1, "status": 1, "custom_status": 1})
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "status": u.get("status", "Active"),
            "custom_status": u.get("custom_status", ""),
        })
    return users


@router.put("/me")
async def update_my_presence(
    body: PresenceUpdate,
    current_user: dict = Depends(get_current_user),
):
    await users_col().update_one(
        {"_id": str_to_oid(current_user["id"])},
        {"$set": {"status": body.status, "custom_status": body.custom_status or ""}}
    )
    return {"ok": True, "status": body.status}
