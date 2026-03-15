import time

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_admin_user, get_current_user
from app.db.mongo import messages_col, rooms_col, temprooms_col
from app.schemas.schemas import TempRoomCreate, TempRoomExtend
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/temprooms", tags=["temprooms"])

_DURATION_MAP = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
}


def _parse_duration_ms(duration: str) -> int:
    if duration in _DURATION_MAP:
        return _DURATION_MAP[duration]
    val = duration.rstrip("mh")
    if not val.isdigit():
        return _DURATION_MAP["1h"]
    ms = int(val) * 60 * 1000
    if duration.endswith("h"):
        ms *= 60
    return ms


@router.get("/")
async def list_temp_rooms(current_user: dict = Depends(get_current_user)):
    cursor = temprooms_col().find({"org_id": current_user["org_id"]})
    return [doc_to_dict(r) async for r in cursor]


@router.post("/", status_code=201)
async def create_temp_room(
    body: TempRoomCreate,
    current_user: dict = Depends(get_current_user),
):
    now = int(time.time() * 1000)
    duration_ms = _parse_duration_ms(body.duration)
    expires_at = now + duration_ms

    # Create a matching room entry
    room_doc = {
        "name": body.name,
        "description": f"Temporary room – expires in {body.duration}",
        "type": "temporary",
        "archived": False,
        "members": [{"user_id": current_user["id"], "room_role": "room_manager", "muted": False}],
        "pinned_message_ids": [],
        "created_by": current_user["id"],
        "org_id": current_user["org_id"],
        "created_at": now,
    }
    room_result = await rooms_col().insert_one(room_doc)
    room_id = str(room_result.inserted_id)

    temp_doc = {
        "room_id": room_id,
        "name": body.name,
        "created_by": current_user["name"],
        "created_by_id": current_user["id"],
        "org_id": current_user["org_id"],
        "duration": body.duration,
        "expires_at": expires_at,
        "locked": False,
        "created_at": now,
    }
    result = await temprooms_col().insert_one(temp_doc)
    temp_doc["_id"] = result.inserted_id

    # System message in the new room
    await messages_col().insert_one({
        "room_id": room_id,
        "text": f'Temporary room "{body.name}" created for {body.duration}. Auto-expiry enabled.',
        "author_id": "system",
        "author_name": "System",
        "org_id": current_user["org_id"],
        "timestamp": now,
        "is_system": True,
        "thread_count": 0,
    })

    return doc_to_dict(temp_doc)


@router.put("/{temp_id}/extend")
async def extend_temp_room(
    temp_id: str,
    body: TempRoomExtend,
    current_user: dict = Depends(get_current_user),
):
    temp = await temprooms_col().find_one({"_id": str_to_oid(temp_id), "org_id": current_user["org_id"]})
    if not temp:
        raise HTTPException(404, "Temp room not found or access denied")
    extra = _parse_duration_ms(body.duration)
    new_expires = temp["expires_at"] + extra
    await temprooms_col().update_one(
        {"_id": str_to_oid(temp_id)},
        {"$set": {"expires_at": new_expires, "locked": False}}
    )
    return {"ok": True, "expires_at": new_expires}


@router.delete("/{temp_id}", status_code=200)
async def terminate_temp_room(
    temp_id: str,
    current_user: dict = Depends(get_current_user),
):
    temp = await temprooms_col().find_one({"_id": str_to_oid(temp_id), "org_id": current_user["org_id"]})
    if not temp:
        raise HTTPException(404, "Temp room not found or access denied")
    now = int(time.time() * 1000)
    await temprooms_col().update_one(
        {"_id": str_to_oid(temp_id)},
        {"$set": {"expires_at": now, "locked": True}}
    )
    # Also archive the main room
    await rooms_col().update_one(
        {"_id": str_to_oid(temp["room_id"])},
        {"$set": {"archived": True}}
    )
    return {"ok": True, "terminated": temp_id}
