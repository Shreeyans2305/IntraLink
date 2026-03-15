import time
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.db.mongo import messages_col, rooms_col
from app.schemas.schemas import MessageCreate
from app.utils.id_utils import doc_to_dict, str_to_oid
from fastapi import HTTPException

router = APIRouter(prefix="/rooms/{room_id}/messages", tags=["messages"])


async def _check_member(room_id: str, user: dict):
    if user["org_role"] == "admin":
        return
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    ids = [m["user_id"] for m in room.get("members", [])]
    if user["id"] not in ids:
        raise HTTPException(403, "Not a member of this room")


async def _check_not_muted(room_id: str, user: dict):
    if user["org_role"] == "admin":
        return
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
    if member and member.get("muted"):
        raise HTTPException(403, "You are muted in this room")


@router.get("/")
async def get_messages(
    room_id: str,
    before: Optional[str] = Query(None, description="Cursor: message id to paginate before"),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    query = {"room_id": room_id}
    if before:
        query["_id"] = {"$lt": str_to_oid(before)}
    cursor = messages_col().find(query).sort("_id", -1).limit(limit)
    docs = [doc_to_dict(d) async for d in cursor]
    return list(reversed(docs))


@router.get("/pinned")
async def get_pinned(room_id: str, current_user: dict = Depends(get_current_user)):
    room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
    pin_ids = room.get("pinned_message_ids", []) if room else []
    if not pin_ids:
        return []
    oids = [str_to_oid(pid) for pid in pin_ids]
    cursor = messages_col().find({"_id": {"$in": oids}})
    return [doc_to_dict(d) async for d in cursor]


@router.post("/{message_id}/pin")
async def pin_message(
    room_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user),
):
    # supervisor or admin
    if current_user["org_role"] != "admin":
        room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
        member = next((m for m in room.get("members", []) if m["user_id"] == current_user["id"]), None)
        if not member or member.get("room_role") != "room_manager":
            raise HTTPException(403, "Room manager or admin required to pin")
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id)},
        {"$addToSet": {"pinned_message_ids": message_id}}
    )
    return {"ok": True, "pinned": message_id}
