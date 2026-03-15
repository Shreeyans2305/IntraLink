from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.db.mongo import messages_col, reactions_col
from app.schemas.schemas import ReactionToggle
from app.utils.id_utils import doc_to_dict, str_to_oid

router = APIRouter(prefix="/messages/{message_id}/reactions", tags=["reactions"])


@router.put("/")
async def toggle_reaction(
    message_id: str,
    body: ReactionToggle,
    current_user: dict = Depends(get_current_user),
):
    msg = await messages_col().find_one({"_id": str_to_oid(message_id), "org_id": current_user["org_id"]})
    if not msg:
        raise HTTPException(404, "Message not found or access denied")

    existing = await reactions_col().find_one({"message_id": message_id})
    if not existing:
        await reactions_col().insert_one({
            "message_id": message_id,
            "org_id": current_user["org_id"],
            "reactions": {body.emoji: [current_user["name"]]},
        })
        return {"message_id": message_id, "reactions": {body.emoji: [current_user["name"]]}}

    reactions = existing.get("reactions", {})
    users = reactions.get(body.emoji, [])
    if current_user["name"] in users:
        users.remove(current_user["name"])
    else:
        users.append(current_user["name"])
    reactions[body.emoji] = users

    await reactions_col().update_one(
        {"message_id": message_id},
        {"$set": {"reactions": reactions}}
    )

    return {"message_id": message_id, "reactions": reactions}


@router.get("/")
async def get_reactions(message_id: str, current_user: dict = Depends(get_current_user)):
    msg = await messages_col().find_one({"_id": str_to_oid(message_id), "org_id": current_user["org_id"]})
    if not msg:
        raise HTTPException(404, "Message not found or access denied")

    doc = await reactions_col().find_one({"message_id": message_id})
    if not doc:
        return {"message_id": message_id, "reactions": {}}
    return {"message_id": message_id, "reactions": doc.get("reactions", {})}
