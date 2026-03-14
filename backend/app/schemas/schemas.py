from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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
    room_role: str = "user"  # user | room_supervisor

class RoomMemberUpdate(BaseModel):
    room_role: str  # user | room_supervisor


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
    org_role: str  # user | room_supervisor | admin

class ModerationResolve(BaseModel):
    resolution: Optional[str] = "resolved"
