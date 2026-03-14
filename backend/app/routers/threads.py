import time

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.mongo import messages_col, threads_col
from app.schemas.schemas import ThreadReplyCreate
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/messages/{message_id}/threads", tags=["threads"])


@router.get("/")
async def get_thread(message_id: str, current_user: dict = Depends(get_current_user)):
    msg = await messages_col().find_one({"_id": str_to_oid(message_id)})
    if not msg:
        raise HTTPException(404, "Message not found")
    cursor = threads_col().find({"parent_message_id": message_id}).sort("_id", 1)
    replies = [doc_to_dict(r) async for r in cursor]
    return replies


@router.post("/", status_code=201)
async def post_reply(
    message_id: str,
    body: ThreadReplyCreate,
    current_user: dict = Depends(get_current_user),
):
    msg = await messages_col().find_one({"_id": str_to_oid(message_id)})
    if not msg:
        raise HTTPException(404, "Parent message not found")

    doc = {
        "parent_message_id": message_id,
        "room_id": msg.get("room_id"),
        "text": body.text,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "timestamp": int(time.time() * 1000),
    }
    result = await threads_col().insert_one(doc)
    doc["_id"] = result.inserted_id

    # Update parent thread count
    count = await threads_col().count_documents({"parent_message_id": message_id})
    await messages_col().update_one(
        {"_id": str_to_oid(message_id)},
        {"$set": {"thread_count": count}}
    )

    return doc_to_dict(doc)
