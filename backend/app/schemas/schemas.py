from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ── Org ───────────────────────────────────────────────────────────────────────

class WhitelistEntryCreate(BaseModel):
    email: EmailStr
    org_role: str = "user"  # user | room_manager

class OrgSetup(BaseModel):
    org_name: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str
    whitelists: Optional[List[WhitelistEntryCreate]] = []


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    org_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    org_id: str

class TokenResponse(BaseModel):
    token: str
    user: dict


# ── Rooms ─────────────────────────────────────────────────────────────────────

class RoomCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    type: str = "standard"  # standard | temporary

class RoomMemberAdd(BaseModel):
    user_id: str
    room_role: str = "user"  # user | room_manager

class RoomMemberUpdate(BaseModel):
    room_role: str  # user | room_manager


# ── Messages ─────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    text: str
    expires_at: Optional[int] = None  # epoch ms


# ── Threads ──────────────────────────────────────────────────────────────────

class ThreadReplyCreate(BaseModel):
    text: str


# ── Reactions ─────────────────────────────────────────────────────────────────

class ReactionToggle(BaseModel):
    emoji: str


# ── Polls ─────────────────────────────────────────────────────────────────────

class PollOption(BaseModel):
    label: str

class PollCreate(BaseModel):
    question: str
    options: List[PollOption]

class PollVote(BaseModel):
    option_id: str


# ── Temp Rooms ────────────────────────────────────────────────────────────────

class TempRoomCreate(BaseModel):
    name: str
    duration: str = "1h"  # 15m | 1h | 4h | 24h

class TempRoomExtend(BaseModel):
    duration: str = "1h"


# ── Presence ──────────────────────────────────────────────────────────────────

class PresenceUpdate(BaseModel):
    status: str
    custom_status: Optional[str] = ""


# ── Admin ─────────────────────────────────────────────────────────────────────

class UserRoleUpdate(BaseModel):
    org_role: str  # user | room_manager | admin

class ModerationResolve(BaseModel):
    resolution: Optional[str] = "resolved"


class LockdownToggle(BaseModel):
    active: bool

class BlastRequest(BaseModel):
    passphrase: str

class ImportBlueprintRequest(BaseModel):
    data: str   # base64-encoded .inm file contents
    passphrase: str
