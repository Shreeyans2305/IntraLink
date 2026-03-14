import time

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.mongo import polls_col, rooms_col
from app.schemas.schemas import PollCreate, PollVote
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/rooms/{room_id}/polls", tags=["polls"])


async def _check_member_or_admin(room_id: str, user: dict):
    if user["org_role"] == "admin":
        return
    room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
    if not room:
        raise HTTPException(404, "Room not found")
    ids = [m["user_id"] for m in room.get("members", [])]
    if user["id"] not in ids:
        raise HTTPException(403, "Not a member")


@router.get("/")
async def list_polls(room_id: str, current_user: dict = Depends(get_current_user)):
    await _check_member_or_admin(room_id, current_user)
    cursor = polls_col().find({"room_id": room_id, "closed": {"$ne": True}})
    return [doc_to_dict(p) async for p in cursor]


@router.post("/", status_code=201)
async def create_poll(
    room_id: str,
    body: PollCreate,
    current_user: dict = Depends(get_current_user),
):
    await _check_member_or_admin(room_id, current_user)
    options = [
        {"id": str(ObjectId()), "label": opt.label, "votes": 0, "voters": []}
        for opt in body.options
    ]
    doc = {
        "room_id": room_id,
        "question": body.question,
        "options": options,
        "closed": False,
        "created_by": current_user["id"],
        "created_at": int(time.time() * 1000),
    }
    result = await polls_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_dict(doc)


@router.post("/{poll_id}/vote")
async def vote_poll(
    room_id: str,
    poll_id: str,
    body: PollVote,
    current_user: dict = Depends(get_current_user),
):
    poll = await polls_col().find_one({"_id": str_to_oid(poll_id), "room_id": room_id})
    if not poll:
        raise HTTPException(404, "Poll not found")
    if poll.get("closed"):
        raise HTTPException(400, "Poll is closed")

    # Prevent double voting
    user_id = current_user["id"]
    for opt in poll["options"]:
        if user_id in opt.get("voters", []):
            raise HTTPException(400, "Already voted")

    await polls_col().update_one(
        {"_id": str_to_oid(poll_id), "options.id": body.option_id},
        {
            "$inc": {"options.$.votes": 1},
            "$push": {"options.$.voters": user_id},
        }
    )
    updated = await polls_col().find_one({"_id": str_to_oid(poll_id)})
    return doc_to_dict(updated)


@router.put("/{poll_id}/close")
async def close_poll(
    room_id: str,
    poll_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["org_role"] not in ("admin", "room_supervisor"):
        room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
        member = next((m for m in room.get("members", []) if m["user_id"] == current_user["id"]), None)
        if not member or member.get("room_role") != "room_supervisor":
            raise HTTPException(403, "Supervisor or admin required")
    await polls_col().update_one(
        {"_id": str_to_oid(poll_id)},
        {"$set": {"closed": True}}
    )
    return {"ok": True}
