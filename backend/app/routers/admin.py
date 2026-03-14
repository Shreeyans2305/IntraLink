import time
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import get_admin_user, get_current_user
from app.db.mongo import audit_col, messages_col, rooms_col, temprooms_col, users_col
from app.schemas.schemas import ModerationResolve, UserRoleUpdate
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def get_metrics(current_user: dict = Depends(get_admin_user)):
    online_users = await users_col().count_documents({"status": {"$ne": "Offline"}})
    total_rooms = await rooms_col().count_documents({"archived": {"$ne": True}})
    temp_rooms = await temprooms_col().count_documents({"locked": {"$ne": True}})

    # messages in last minute (approximation)
    one_min_ago = int(time.time() * 1000) - 60_000
    recent_msgs = await messages_col().count_documents({"timestamp": {"$gte": one_min_ago}})

    # Pending moderation items (anomaly=True in last 24h)
    day_ago = int(time.time() * 1000) - 86_400_000
    spam_alerts = await audit_col().count_documents({
        "anomaly": True,
        "timestamp": {"$gte": day_ago},
    })

    return {
        "onlineUsers": online_users,
        "messagesPerMinute": recent_msgs,
        "tempRooms": temp_rooms,
        "spamAlerts": spam_alerts,
        "totalRooms": total_rooms,
    }


@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user),
):
    cursor = audit_col().find({}).sort("timestamp", -1).skip(skip).limit(limit)
    logs = [doc_to_dict(log) async for log in cursor]
    return logs


@router.get("/moderation")
async def get_moderation_queue(current_user: dict = Depends(get_admin_user)):
    cursor = audit_col().find({"anomaly": True, "resolved": {"$ne": True}}).sort("timestamp", -1).limit(100)
    items = [doc_to_dict(item) async for item in cursor]
    return items


@router.put("/moderation/{item_id}/resolve")
async def resolve_moderation(
    item_id: str,
    body: ModerationResolve,
    current_user: dict = Depends(get_admin_user),
):
    await audit_col().update_one(
        {"_id": str_to_oid(item_id)},
        {"$set": {"resolved": True, "resolution": body.resolution, "resolved_by": current_user["id"]}}
    )
    return {"ok": True}


@router.get("/users")
async def list_users(current_user: dict = Depends(get_admin_user)):
    cursor = users_col().find({}, {"hashed_password": 0})
    users = []
    async for u in cursor:
        d = doc_to_dict(u)
        d.pop("hashed_password", None)
        users.append(d)
    return users


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: UserRoleUpdate,
    current_user: dict = Depends(get_admin_user),
):
    allowed = {"user", "room_supervisor", "admin"}
    if body.org_role not in allowed:
        from fastapi import HTTPException
        raise HTTPException(400, f"Role must be one of: {allowed}")
    await users_col().update_one(
        {"_id": str_to_oid(user_id)},
        {"$set": {"org_role": body.org_role}}
    )
    await audit_col().insert_one({
        "user_id": current_user["id"],
        "user": current_user["email"],
        "action": "permission_change",
        "detail": f"Changed {user_id} org_role to {body.org_role}",
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })
    return {"ok": True}
