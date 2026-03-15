"""
Socket.IO event manager.
All events require a JWT token either via the handshake auth or as a query param.
"""
import time

import socketio

from app.core.security import decode_access_token
from app.db.mongo import (
    messages_col,
    polls_col,
    reactions_col,
    rooms_col,
    system_config_col,
    temprooms_col,
    threads_col,
    users_col,
    whispers_col,
)
from app.utils.id_utils import doc_to_dict, str_to_oid

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# sid → user dict
_sid_user: dict[str, dict] = {}
# user_id → set of sids
_user_sids: dict[str, set] = {}

# ── Lockdown state ──────────────────────────────────────────────────────────────────────

_lockdown_active: bool = False


async def _load_lockdown_state() -> None:
    """Load persisted lockdown flag from DB at startup."""
    global _lockdown_active
    doc = await system_config_col().find_one({"key": "lockdown"})
    _lockdown_active = bool(doc["value"]) if doc else False


async def set_lockdown_state(active: bool) -> None:
    """Persist lockdown flag and broadcast to all connected clients."""
    global _lockdown_active
    _lockdown_active = active
    await system_config_col().update_one(
        {"key": "lockdown"},
        {"$set": {"key": "lockdown", "value": active}},
        upsert=True,
    )
    event = "lockdown_activated" if active else "lockdown_deactivated"
    await sio.emit(event, {"active": active})


async def _auth_sid(sid: str, environ: dict) -> dict | None:
    """Extract + verify JWT from handshake, return user or None."""
    auth = environ.get("HTTP_AUTHORIZATION", "")
    token = None
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        # Try socket.io auth dict (sent as HTTP header socketio-auth)
        token = environ.get("HTTP_SOCKETIO_AUTH", "")
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user = await users_col().find_one({"_id": str_to_oid(payload["sub"])})
    if not user:
        return None
    user["id"] = str(user.pop("_id"))
    return user


def _register_sid(sid: str, user: dict):
    _sid_user[sid] = user
    _user_sids.setdefault(user["id"], set()).add(sid)


def _unregister_sid(sid: str):
    user = _sid_user.pop(sid, None)
    if user:
        _user_sids.get(user["id"], set()).discard(sid)


# ── Connection / Disconnection ────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    # auth dict from socket.io-client: { token: "..." }
    token = None
    if isinstance(auth, dict):
        token = auth.get("token")
    if not token:
        # Fallback: check HTTP Authorization header
        token = (environ.get("HTTP_AUTHORIZATION", "") or "").removeprefix("Bearer ").strip()

    if not token:
        await sio.disconnect(sid)
        return False

    payload = decode_access_token(token)
    if not payload:
        await sio.disconnect(sid)
        return False

    user = await users_col().find_one({"_id": str_to_oid(payload["sub"])})
    if not user:
        await sio.disconnect(sid)
        return False
    user["id"] = str(user.pop("_id"))
    _register_sid(sid, user)
    # Join organization room for scoped broadcasts (e.g. presence)
    if "org_id" in user:
        await sio.enter_room(sid, f"org_{user['org_id']}")
    await sio.emit("lockdown_status", {"active": _lockdown_active}, to=sid)
    return True


@sio.event
async def disconnect(sid):
    _unregister_sid(sid)


# ── Room Management ───────────────────────────────────────────────────────────

@sio.event
async def join_room(sid, data):
    room_id = data.get("room_id")
    if not room_id:
        return
    await sio.enter_room(sid, room_id)
    user = _sid_user.get(sid)
    if user:
        await sio.emit("system_message", {
            "room_id": room_id,
            "text": f"{user['name']} joined the room.",
        }, room=room_id, skip_sid=sid)


@sio.event
async def leave_room(sid, data):
    room_id = data.get("room_id")
    if room_id:
        await sio.leave_room(sid, room_id)


# ── Messaging ─────────────────────────────────────────────────────────────────

@sio.event
async def send_message(sid, data):

    user = _sid_user.get(sid)
    if not user:
        return

    room_id = data.get("room_id")
    text = data.get("text", "").strip()
    if not room_id or not text:
        return

    # Check mute
    try:
        room_oid = str_to_oid(room_id)
        room = await rooms_col().find_one({"_id": room_oid})
    except ValueError:
        await sio.emit("error", {"message": f"Invalid Room ID '{room_id}'"}, to=sid)
        return

    if room:
        member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
        if not member and user.get("org_role") != "admin":
            await sio.emit("error", {"message": "You are not a member of this room."}, to=sid)
            return

        if member and member.get("muted"):
            await sio.emit("error", {"message": "You are muted in this room."}, to=sid)
            return

    now = int(time.time() * 1000)
    doc = {
        "room_id": room_id,
        "text": text,
        "author_id": user["id"],
        "author_name": user["name"],
        "org_id": user["org_id"],
        "timestamp": now,
        "expires_at": data.get("expires_at"),
        "is_system": False,
        "thread_count": 0,
    }
    result = await messages_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    out = doc_to_dict(doc)

    await sio.emit("new_message", out, room=room_id)


@sio.event
async def send_whisper(sid, data):
    if _lockdown_active:
        await sio.emit("error", {"message": "All real-time actions are disabled during Lockdown Mode."}, to=sid)
        return

    user = _sid_user.get(sid)
    if not user:
        return

    room_id = data.get("room_id")
    target_username = data.get("target_username")
    text = data.get("text", "").strip()

    if not room_id or not target_username or not text:
        return

    # Mute/Membership check for sender
    try:
        room_oid = str_to_oid(room_id)
        room = await rooms_col().find_one({"_id": room_oid})
    except ValueError:
        await sio.emit("error", {"message": f"Invalid Room ID '{room_id}'"}, to=sid)
        return

    if room:
        member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
        if not member and user.get("org_role") != "admin":
            await sio.emit("error", {"message": "You are not a member of this room."}, to=sid)
            return
        if member and member.get("muted"):
            await sio.emit("error", {"message": "You are muted in this room."}, to=sid)
            return

    # Find the target user
    target_user = await users_col().find_one({"name": target_username})
    if not target_user:
        await sio.emit("error", {"message": f"User '{target_username}' not found."}, to=sid)
        return

    target_user_id = str(target_user["_id"])

    # Check target user membership (PRD: system error if not in room)
    target_member = next((m for m in room.get("members", []) if m["user_id"] == target_user_id), None)
    if not target_member and target_user.get("org_role") != "admin":
        await sio.emit("error", {"message": f"{target_username} is not currently in this room."}, to=sid)
        return

    target_sids = _user_sids.get(target_user_id, set())

    now = int(time.time() * 1000)
    doc = {
        "room_id": room_id,
        "text": text,
        "author_id": user["id"],
        "author_name": user["name"],
        "org_id": user["org_id"],
        "target_username": target_username,
        "target_id": target_user_id,
        "timestamp": now,
        "is_system": False,
        "isWhisper": True, # distinctive flag
    }
    result = await whispers_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    out = doc_to_dict(doc)

    # Emit back to sender
    await sio.emit("new_whisper", out, to=sid)

    # Emit to recipient's active sessions
    for tsid in target_sids:
        # Don't emit to the same sid twice if somehow they whisper themselves
        if tsid != sid:
            await sio.emit("new_whisper", out, to=tsid)


# ── Typing Indicators ─────────────────────────────────────────────────────────

# room_id → set of names currently typing
_typing: dict[str, set] = {}


@sio.event
async def typing_start(sid, data):
    user = _sid_user.get(sid)
    room_id = data.get("room_id")
    if not user or not room_id:
        return
    _typing.setdefault(room_id, set()).add(user["name"])
    await sio.emit("typing_users", {"room_id": room_id, "users": list(_typing[room_id])}, room=room_id)


@sio.event
async def typing_stop(sid, data):
    user = _sid_user.get(sid)
    room_id = data.get("room_id")
    if not user or not room_id:
        return
    _typing.get(room_id, set()).discard(user["name"])
    await sio.emit("typing_users", {"room_id": room_id, "users": list(_typing.get(room_id, set()))}, room=room_id)


# ── Reactions ─────────────────────────────────────────────────────────────────

@sio.event
async def toggle_reaction(sid, data):

    user = _sid_user.get(sid)
    if not user:
        return
    message_id = data.get("message_id")
    emoji = data.get("emoji")
    if not message_id or not emoji:
        return

    try:
        msg_oid = str_to_oid(message_id)
        msg = await messages_col().find_one({"_id": msg_oid})
    except ValueError:
        await sio.emit("error", {"message": f"Invalid Message ID '{message_id}'"}, to=sid)
        return

    if not msg:
        return

    room_id = msg.get("room_id")
    if room_id:
        room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
        if room:
            member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
            if not member and user.get("org_role") != "admin":
                await sio.emit("error", {"message": "You are not a member of this room."}, to=sid)
                return

    existing = await reactions_col().find_one({"message_id": message_id})
    if not existing:
        await reactions_col().insert_one({
            "message_id": message_id,
            "reactions": {emoji: [user["name"]]},
        })
        reactions = {emoji: [user["name"]]}
    else:
        reactions = existing.get("reactions", {})
        users = reactions.get(emoji, [])
        if user["name"] in users:
            users.remove(user["name"])
        else:
            users.append(user["name"])
        
        # Cleanup empty lists
        if not users:
            reactions.pop(emoji, None)
        else:
            reactions[emoji] = users

        await reactions_col().update_one(
            {"message_id": message_id},
            {"$set": {"reactions": reactions}}
        )

    if room_id:
        await sio.emit("reaction_update", {"message_id": message_id, "reactions": reactions}, room=room_id)


# ── Thread Replies ────────────────────────────────────────────────────────────

@sio.event
async def thread_reply(sid, data):

    user = _sid_user.get(sid)
    if not user:
        return
    parent_id = data.get("parent_message_id")
    text = data.get("text", "").strip()
    if not parent_id or not text:
        return

    try:
        parent_oid = str_to_oid(parent_id)
        parent = await messages_col().find_one({"_id": parent_oid})
    except ValueError:
        await sio.emit("error", {"message": f"Invalid Parent Message ID '{parent_id}'"}, to=sid)
        return

    if not parent:
        return

    room_id = parent.get("room_id")
    if room_id:
        room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
        if room:
            member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
            if not member and user.get("org_role") != "admin":
                await sio.emit("error", {"message": "You are not a member of this room."}, to=sid)
                return
            if member and member.get("muted"):
                await sio.emit("error", {"message": "You are muted in this room."}, to=sid)
                return

    now = int(time.time() * 1000)
    doc = {
        "parent_message_id": parent_id,
        "room_id": parent.get("room_id"),
        "text": text,
        "author_id": user["id"],
        "author_name": user["name"],
        "timestamp": now,
    }
    result = await threads_col().insert_one(doc)
    doc["_id"] = result.inserted_id

    count = await threads_col().count_documents({"parent_message_id": parent_id})
    await messages_col().update_one(
        {"_id": str_to_oid(parent_id)},
        {"$set": {"thread_count": count}}
    )

    room_id = parent.get("room_id")
    if room_id:
        await sio.emit("thread_update", {
            "parent_id": parent_id,
            "reply": doc_to_dict(doc),
            "thread_count": count,
        }, room=room_id)


# ── Presence ──────────────────────────────────────────────────────────────────

@sio.event
async def presence_update(sid, data):
    user = _sid_user.get(sid)
    if not user:
        return
    status = data.get("status", "Active")
    custom_status = data.get("custom_status", "")
    await users_col().update_one(
        {"_id": str_to_oid(user["id"])},
        {"$set": {"status": status, "custom_status": custom_status}}
    )
    await sio.emit("presence_update", {
        "user_id": user["id"],
        "name": user["name"],
        "status": status,
        "custom_status": custom_status,
    }, room=f"org_{user['org_id']}")  # broadcast only to organization


# ── Poll Voting ───────────────────────────────────────────────────────────────

@sio.event
async def poll_vote(sid, data):
    print(f"DEBUG poll_vote received from {sid} data={data}")
    user = _sid_user.get(sid)
    if not user:
        print(f"DEBUG no user found for sid {sid}")
        return
    poll_id = data.get("poll_id")
    option_id = data.get("option_id")
    if not poll_id or not option_id:
        print(f"DEBUG missing poll_id {poll_id} or option_id {option_id}")
        return

    try:
        poll_oid = str_to_oid(poll_id)
        poll = await polls_col().find_one({"_id": poll_oid})
    except ValueError:
        await sio.emit("error", {"message": f"Invalid Poll ID '{poll_id}'"}, to=sid)
        return

    if not poll or poll.get("closed"):
        return

    room_id = poll.get("room_id")
    if room_id:
        room = await rooms_col().find_one({"_id": str_to_oid(room_id)})
        if room:
            member = next((m for m in room.get("members", []) if m["user_id"] == user["id"]), None)
            if not member and user.get("org_role") != "admin":
                await sio.emit("error", {"message": "You are not a member of this room."}, to=sid)
                return

    # Check already voted
    for opt in poll["options"]:
        if user["id"] in opt.get("voters", []):
            return

    new_options = []
    for opt in poll.get("options", []):
        if opt["id"] == option_id:
            opt["votes"] = opt.get("votes", 0) + 1
            voters = opt.get("voters", [])
            voters.append(user["id"])
            opt["voters"] = voters
        new_options.append(opt)

    await polls_col().update_one(
        {"_id": poll_oid},
        {"$set": {"options": new_options}}
    )

    updated = await polls_col().find_one({"_id": poll_oid})
    room_id = updated.get("room_id")
    if room_id:
        await sio.emit("poll_update", doc_to_dict(updated), room=room_id)


# ── Admin: Kick & Mute (server emits targeted events) ────────────────────────

async def emit_kick(room_id: str, user_id: str):
    """Called by admin/supervisor after kicking a user via REST."""
    target_sids = _user_sids.get(user_id, set())
    for target_sid in list(target_sids):
        await sio.emit("user_kicked", {"room_id": room_id}, to=target_sid)
        await sio.leave_room(target_sid, room_id)
    await sio.emit("user_kicked", {"room_id": room_id, "user_id": user_id}, room=room_id)


async def emit_mute(room_id: str, user_id: str, muted: bool):
    """Called by admin/supervisor after muting a user via REST."""
    target_sids = _user_sids.get(user_id, set())
    for target_sid in list(target_sids):
        await sio.emit("user_muted", {"room_id": room_id, "muted": muted}, to=target_sid)
    await sio.emit("user_muted", {"room_id": room_id, "user_id": user_id, "muted": muted}, room=room_id)


async def emit_room_expired(room_id: str):
    """Called by the background scheduler when a temp room expires."""
    await sio.emit("room_expired", {"room_id": room_id}, room=room_id)
