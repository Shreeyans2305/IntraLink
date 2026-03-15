import time
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_admin_user, get_current_user
from app.db.mongo import audit_col, rooms_col, users_col
from app.schemas.schemas import RoomCreate, RoomMemberAdd, RoomMemberUpdate
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _room_out(doc: dict) -> dict:
    return doc_to_dict(doc)


async def _check_supervisor_or_admin(room_id: str, user: dict):
    """Raise 403 unless user is admin or room_supervisor in this room."""
    if user["org_role"] == "admin":
        return
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
    if not member or member.get("room_role") != "room_manager":
        raise HTTPException(403, "Room manager or admin required")


async def _write_audit(user_id: str, user_email: str, org_id: str, action: str, detail: str):
    await audit_col().insert_one({
        "user_id": user_id,
        "user": user_email,
        "org_id": org_id,
        "action": action,
        "detail": detail,
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })


@router.get("/")
async def list_rooms(current_user: dict = Depends(get_current_user)):
    # Scope rooms to the user's organization
    cursor = rooms_col().find({"archived": {"$ne": True}, "org_id": current_user["org_id"]})
    rooms = [_room_out(r) async for r in cursor]
    return rooms


@router.post("/", status_code=201)
async def create_room(
    body: RoomCreate,
    current_user: dict = Depends(get_admin_user),
):
    doc = {
        "name": body.name,
        "description": body.description,
        "type": "standard",
        "archived": False,
        "members": [{"user_id": current_user["id"], "room_role": "room_manager"}],
        "pinned_message_ids": [],
        "created_by": current_user["id"],
        "org_id": current_user["org_id"],
        "created_at": int(time.time() * 1000),
    }
    result = await rooms_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "room_create", f"Created room {body.name}")
    return _room_out(doc)


@router.get("/{room_id}")
async def get_room(room_id: str, current_user: dict = Depends(get_current_user)):
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": current_user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    return _room_out(room)


@router.delete("/{room_id}", status_code=204)
async def delete_room(room_id: str, current_user: dict = Depends(get_admin_user)):
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"]},
        {"$set": {"archived": True}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "room_delete", f"Archived room {room_id}")


@router.post("/{room_id}/join", status_code=200)
async def join_room(room_id: str, current_user: dict = Depends(get_current_user)):
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": current_user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if current_user["id"] in member_ids:
        return {"ok": True, "message": "Already a member"}
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"]},
        {"$push": {"members": {"user_id": current_user["id"], "room_role": "user"}}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "room_join", f"Joined room {room_id}")
    return {"ok": True}


@router.delete("/{room_id}/leave", status_code=200)
async def leave_room(room_id: str, current_user: dict = Depends(get_current_user)):
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"]},
        {"$pull": {"members": {"user_id": current_user["id"]}}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "room_leave", f"Left room {room_id}")
    return {"ok": True}


@router.post("/{room_id}/members", status_code=201)
async def add_member(
    room_id: str,
    body: RoomMemberAdd,
    current_user: dict = Depends(get_current_user),
):
    await _check_supervisor_or_admin(room_id, current_user)
    room = await rooms_col().find_one({"_id": str_to_oid(room_id), "org_id": current_user["org_id"]})
    if not room:
        raise HTTPException(404, "Room not found or access denied")
    member_ids = [m["user_id"] for m in room.get("members", [])]
    if body.user_id in member_ids:
        return {"ok": True, "message": "Already a member"}
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"]},
        {"$push": {"members": {"user_id": body.user_id, "room_role": body.room_role, "muted": False}}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "member_add", f"Added {body.user_id} to {room_id}")
    return {"ok": True}


@router.put("/{room_id}/members/{user_id}")
async def update_member_role(
    room_id: str,
    user_id: str,
    body: RoomMemberUpdate,
    current_user: dict = Depends(get_current_user),
):
    await _check_supervisor_or_admin(room_id, current_user)
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"], "members.user_id": user_id},
        {"$set": {"members.$.room_role": body.room_role}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "role_update", f"Updated {user_id} role in {room_id}")
    return {"ok": True}


@router.delete("/{room_id}/members/{user_id}", status_code=200)
async def kick_member(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    await _check_supervisor_or_admin(room_id, current_user)
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"]},
        {"$pull": {"members": {"user_id": user_id}}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "member_kick", f"Kicked {user_id} from {room_id}")
    return {"ok": True, "kicked": user_id}


@router.post("/{room_id}/mute/{user_id}")
async def mute_member(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    await _check_supervisor_or_admin(room_id, current_user)
    # Store mute state in the member subdoc
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"], "members.user_id": user_id},
        {"$set": {"members.$.muted": True}}
    )
    await _write_audit(current_user["id"], current_user["email"], current_user["org_id"], "member_mute", f"Muted {user_id} in {room_id}")
    return {"ok": True, "muted": user_id}


@router.post("/{room_id}/unmute/{user_id}")
async def unmute_member(
    room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    await _check_supervisor_or_admin(room_id, current_user)
    await rooms_col().update_one(
        {"_id": str_to_oid(room_id), "org_id": current_user["org_id"], "members.user_id": user_id},
        {"$set": {"members.$.muted": False}}
    )
    return {"ok": True, "unmuted": user_id}
