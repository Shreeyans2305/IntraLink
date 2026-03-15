import base64
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.core.deps import get_admin_user, get_current_user
from app.db.mongo import (
    audit_col,
    whitelists_col,
    messages_col,
    org_col,
    polls_col,
    reactions_col,
    rooms_col,
    temprooms_col,
    threads_col,
    users_col,
)
from app.schemas.schemas import (
    BlastRequest,
    ImportBlueprintRequest,
    WhitelistEntryCreate,
    LockdownToggle,
    ModerationResolve,
    UserRoleUpdate,
)
from app.utils.encryption import decrypt_blueprint, encrypt_blueprint
from app.utils.id_utils import doc_to_dict, str_to_oid
from app.websockets.socket_manager import set_lockdown_state

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Metrics ───────────────────────────────────────────────────────────────────

@router.get("/metrics")
async def get_metrics(current_user: dict = Depends(get_admin_user)):
    online_users = await users_col().count_documents({"status": {"$ne": "Offline"}})
    total_rooms = await rooms_col().count_documents({"archived": {"$ne": True}})
    temp_rooms = await temprooms_col().count_documents({"locked": {"$ne": True}})

    one_min_ago = int(time.time() * 1000) - 60_000
    recent_msgs = await messages_col().count_documents({"timestamp": {"$gte": one_min_ago}})

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


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get("/audit-log")
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user),
):
    cursor = audit_col().find({}).sort("timestamp", -1).skip(skip).limit(limit)
    return [doc_to_dict(log) async for log in cursor]


# ── Moderation ────────────────────────────────────────────────────────────────

@router.get("/moderation")
async def get_moderation_queue(current_user: dict = Depends(get_admin_user)):
    cursor = audit_col().find({"anomaly": True, "resolved": {"$ne": True}}).sort("timestamp", -1).limit(100)
    return [doc_to_dict(item) async for item in cursor]


@router.put("/moderation/{item_id}/resolve")
async def resolve_moderation(
    item_id: str,
    body: ModerationResolve,
    current_user: dict = Depends(get_admin_user),
):
    await audit_col().update_one(
        {"_id": str_to_oid(item_id)},
        {"$set": {"resolved": True, "resolution": body.resolution, "resolved_by": current_user["id"]}},
    )
    return {"ok": True}


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(current_user: dict = Depends(get_current_user)):
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
    allowed = {"user", "room_manager", "admin"}
    if body.org_role not in allowed:
        raise HTTPException(400, f"Role must be one of: {allowed}")
    await users_col().update_one(
        {"_id": str_to_oid(user_id)},
        {"$set": {"org_role": body.org_role}},
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


# ── Whitelist ───────────────────────────────────────────────────────────────────

@router.get("/whitelist")
async def list_whitelist(current_user: dict = Depends(get_admin_user)):
    cursor = whitelists_col().find({})
    return [doc_to_dict(wl) async for wl in cursor]


@router.post("/whitelist", status_code=201)
async def add_whitelist(
    body: WhitelistEntryCreate,
    current_user: dict = Depends(get_admin_user),
):
    allowed_roles = {"user", "room_manager"}
    if body.org_role not in allowed_roles:
        raise HTTPException(400, f"org_role must be one of: {allowed_roles}")

    email_lower = body.email.lower()

    # Don't whitelist someone already registered
    existing = await users_col().find_one({"email": email_lower})
    if existing:
        raise HTTPException(400, "User with this email is already registered")

    await whitelists_col().update_one(
        {"email": email_lower},
        {"$set": {"email": email_lower, "org_role": body.org_role, "added_by": current_user["id"], "added_at": int(time.time() * 1000)}},
        upsert=True,
    )
    await audit_col().insert_one({
        "user_id": current_user["id"],
        "user": current_user["email"],
        "action": "whitelist_add",
        "detail": f"Whitelisted {email_lower} as {body.org_role}",
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })
    return {"ok": True, "email": email_lower, "org_role": body.org_role}


@router.delete("/whitelist/{email}", status_code=200)
async def revoke_whitelist(
    email: str,
    current_user: dict = Depends(get_admin_user),
):
    result = await whitelists_col().delete_one({"email": email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(404, "Whitelist entry not found")
    return {"ok": True, "revoked": email.lower()}


# ── Lockdown ──────────────────────────────────────────────────────────────────

@router.get("/lockdown")
async def get_lockdown(current_user: dict = Depends(get_admin_user)):
    from app.websockets.socket_manager import _lockdown_active
    return {"active": _lockdown_active}


@router.post("/lockdown")
async def toggle_lockdown(
    body: LockdownToggle,
    current_user: dict = Depends(get_admin_user),
):
    await set_lockdown_state(body.active)
    await audit_col().insert_one({
        "user_id": current_user["id"],
        "user": current_user["email"],
        "action": "lockdown_activated" if body.active else "lockdown_deactivated",
        "detail": f"Lockdown {'enabled' if body.active else 'disabled'} by {current_user['email']}",
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })
    return {"ok": True, "active": body.active}


# ── Blast ─────────────────────────────────────────────────────────────────────

@router.post("/blast")
async def blast(
    body: BlastRequest,
    current_user: dict = Depends(get_admin_user),
):
    """Generate an encrypted blueprint of the org structure, then wipe all room data."""
    # 1. Collect blueprint
    org = await org_col().find_one({})
    org_name = org.get("name", "") if org else ""

    rooms_cursor = rooms_col().find({"archived": {"$ne": True}})
    rooms_data = []
    async for room in rooms_cursor:
        # Enrich members with email for portability
        members = []
        for m in room.get("members", []):
            user = await users_col().find_one({"_id": str_to_oid(m["user_id"])}, {"email": 1})
            members.append({
                "email": user["email"] if user else "",
                "room_role": m.get("room_role", "user"),
            })
        rooms_data.append({
            "name": room["name"],
            "description": room.get("description", ""),
            "type": room.get("type", "standard"),
            "members": members,
        })

    # Collect whitelist
    whitelist_cursor = whitelists_col().find({})
    whitelist_data = [
        {"email": wl["email"], "org_role": wl["org_role"]}
        async for wl in whitelist_cursor
    ]

    blueprint = {
        "org": {"name": org_name},
        "rooms": rooms_data,
        "whitelisted_users": whitelist_data,
    }

    # 2. Encrypt
    encrypted = encrypt_blueprint(blueprint, body.passphrase)

    # 3. Wipe all room data (messages, threads, reactions, polls, temprooms, rooms)
    await messages_col().delete_many({})
    await threads_col().delete_many({})
    await reactions_col().delete_many({})
    await polls_col().delete_many({})
    await temprooms_col().delete_many({})
    await rooms_col().delete_many({})

    await audit_col().insert_one({
        "user_id": current_user["id"],
        "user": current_user["email"],
        "action": "blast",
        "detail": f"Blast executed by {current_user['email']} – all room data wiped",
        "timestamp": int(time.time() * 1000),
        "anomaly": False,
    })

    return Response(
        content=encrypted,
        media_type="application/octet-stream",
        headers={"Content-Disposition": 'attachment; filename="blueprint.inm"'},
    )


@router.post("/import-blueprint", status_code=200)
async def import_blueprint(
    body: ImportBlueprintRequest,
    current_user: dict = Depends(get_admin_user),
):
    """Decrypt a blueprint file and restore rooms + whitelist list."""
    try:
        raw = base64.b64decode(body.data)
        blueprint = decrypt_blueprint(raw, body.passphrase)
    except Exception:
        raise HTTPException(400, "Invalid blueprint file or wrong passphrase")

    now = int(time.time() * 1000)

    # Restore rooms
    created_rooms = 0
    for room_data in blueprint.get("rooms", []):
        room_doc = {
            "name": room_data["name"],
            "description": room_data.get("description", ""),
            "type": room_data.get("type", "standard"),
            "archived": False,
            "members": [],
            "pinned_message_ids": [],
            "created_by": current_user["id"],
            "created_at": now,
        }
        # Match existing users by email and restore room memberships
        for member in room_data.get("members", []):
            user = await users_col().find_one({"email": member["email"]})
            if user:
                room_doc["members"].append({
                    "user_id": str(user["_id"]),
                    "room_role": member.get("room_role", "user"),
                    "muted": False,
                })
        await rooms_col().insert_one(room_doc)
        created_rooms += 1

    # Restore whitelist
    restored_whitelists = 0
    for whitelist_entry in blueprint.get("whitelisted_users", []):
        email = whitelist_entry["email"].lower()
        existing_user = await users_col().find_one({"email": email})
        if not existing_user:
            await whitelists_col().update_one(
                {"email": email},
                {"$set": {"email": email, "org_role": whitelist_entry.get("org_role", "user"), "added_by": current_user["id"], "added_at": now}},
                upsert=True,
            )
            restored_whitelists += 1

    await audit_col().insert_one({
        "user_id": current_user["id"],
        "user": current_user["email"],
        "action": "blueprint_import",
        "detail": f"Blueprint imported: {created_rooms} rooms, {restored_whitelists} whitelist entries restored",
        "timestamp": now,
        "anomaly": False,
    })

    return {"ok": True, "rooms_created": created_rooms, "whitelists_restored": restored_whitelists}
