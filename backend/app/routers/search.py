from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.db.mongo import messages_col, rooms_col, users_col
from app.utils.id_utils import doc_to_dict

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/")
async def search(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    query_lower = q.lower()
    results = {"rooms": [], "messages": [], "people": []}

    # Rooms
    if current_user["org_role"] == "admin":
        room_cursor = rooms_col().find(
            {"archived": {"$ne": True}, "name": {"$regex": query_lower, "$options": "i"}},
            {"name": 1, "type": 1}
        ).limit(10)
    else:
        room_cursor = rooms_col().find(
            {
                "archived": {"$ne": True},
                "members.user_id": current_user["id"],
                "name": {"$regex": query_lower, "$options": "i"},
            },
            {"name": 1, "type": 1}
        ).limit(10)

    async for room in room_cursor:
        results["rooms"].append({
            "id": str(room["_id"]),
            "label": f"#{room['name']}",
            "meta": "Temporary room" if room.get("type") == "temporary" else "Standard room",
            "type": "room",
            "roomId": str(room["_id"]),
        })

    # Messages (text search)
    msg_cursor = messages_col().find(
        {"text": {"$regex": query_lower, "$options": "i"}},
        {"text": 1, "room_id": 1, "author_name": 1}
    ).limit(10)
    async for msg in msg_cursor:
        results["messages"].append({
            "id": str(msg["_id"]),
            "label": msg.get("text", ""),
            "meta": f"Message in room",
            "type": "message",
            "roomId": msg.get("room_id"),
        })

    # People
    people_cursor = users_col().find(
        {"name": {"$regex": query_lower, "$options": "i"}},
        {"name": 1, "org_role": 1, "status": 1}
    ).limit(10)
    async for person in people_cursor:
        results["people"].append({
            "id": str(person["_id"]),
            "label": person.get("name", ""),
            "meta": person.get("org_role", "user"),
            "type": "profile",
        })

    return results
