# Product Requirements Document (PRD)
## The Internal Network — Controlled Internal Messaging Platform

**Version:** 1.1  
**Status:** Draft  
**Last Updated:** March 14, 2026  
**Author:** Engineering Team  
**Stakeholders:** Engineering, Security, Product, DevOps

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Basic Features](#7-basic-features)
8. [Advanced Features](#8-advanced-features)
9. [Database Schema (High-Level)](#9-database-schema-high-level)
10. [API Endpoints (High-Level)](#10-api-endpoints-high-level)
11. [Security Considerations](#11-security-considerations)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Milestones & Phased Rollout](#13-milestones--phased-rollout)
14. [Open Questions & Risks](#14-open-questions--risks)

---

## 1. Executive Summary

The Internal Network is a **self-hosted, real-time internal messaging platform** built for distributed engineering organisations that require full control over their communications infrastructure. Unlike third-party tools, this platform enforces a strict role-based permission hierarchy, supports an extensible command system, and provides enterprise-grade features such as encrypted migration bundles, lockdown mode, smart spam detection, and load balancing — all within a secure, auditable environment.

---

## 2. Problem Statement

Organisations handling sensitive internal communications cannot rely on external platforms where data sovereignty, permission models, and auditability are outside their control. There is a need for:

- **Instant, reliable** internal communication across rooms and individuals.
- **Hierarchical role enforcement** — not everyone holds equal power.
- **Extensibility** through a command system that goes beyond standard messaging.
- **Operational resilience** — the system must survive server migrations, network outages, and scaling events.

---

## 3. Goals & Success Metrics

| Goal | Success Metric |
|---|---|
| Real-time reliability | Message delivery latency < 200ms under normal load |
| Role enforcement | 100% of permission checks enforced server-side |
| Scalability | Platform handles 10,000+ concurrent users across multiple rooms |
| Migration fidelity | Encrypted migration restores full org structure with 0 data loss |
| Spam control | False positive rate for spam detection < 1% |
| Uptime | 99.9% availability SLA |

---

## 4. Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React (TypeScript) | Component-based UI, real-time state management |
| Backend | Python (FastAPI) | Async support, WebSocket handling, fast prototyping |
| Real-Time Layer | WebSockets (via FastAPI + `websockets`) | Native bidirectional communication |
| Primary Database | MongoDB | Flexible document model for messages, rooms, users, polls; native Change Streams for pub-sub |
| ODM | Beanie (async Motor) | Async MongoDB ODM built on Pydantic, matches FastAPI models natively |
| File Storage | MinIO (S3-compatible) | Encrypted file sharing, self-hosted |
| Load Balancer | Nginx + custom Python middleware | Traffic distribution, rate limiting |
| Auth | JWT + bcrypt | Stateless auth with secure password hashing |
| Encryption | AES-256 (migration bundles), TLS 1.3 (transit) | Data at rest and in transit |

---

## 5. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Clients                          │
│              React SPA (Browser / Desktop)              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────────┐
│                   Nginx Load Balancer                   │
│            (Rate Limiting, SSL Termination)             │
└──────┬──────────────────────────┬───────────────────────┘
       │                          │
┌──────▼──────┐           ┌───────▼──────┐
│  API Server │           │  API Server  │   ← Multiple instances
│  (FastAPI)  │           │  (FastAPI)   │
└──────┬──────┘           └───────┬──────┘
       │                          │
┌──────▼──────────────────────────▼───────────────────────┐
│                    MongoDB Database                     │
│   (Users, Rooms, Messages, Polls, Logs — Change Stream) │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                MinIO File Storage                       │
│         (Encrypted file attachments, backups)           │
└─────────────────────────────────────────────────────────┘
```

---

## 6. User Roles & Permissions

The platform operates on a **three-tier hierarchy**. Roles are enforced server-side on every action.

| Role | Description | Permissions |
|---|---|---|
| **Super Admin** | Holds ultimate authority | Create/delete all rooms, manage all users, view admin dashboard, trigger lockdown mode, initiate migration export, assign/revoke any role |
| **Room Moderator** | Manages specific rooms | Create/archive rooms they own, kick/mute users in their rooms, pin messages, manage polls |
| **Member** | Standard participant | Send/receive messages, use commands, vote in polls, share files (within limits) |

> Role assignments are stored server-side and validated on every WebSocket message and REST request. Clients never self-report their own role.

---

## 7. Basic Features

### 7.1 User Authentication

**Description:** Secure registration and login system with session management.

**Requirements:**
- Users register with a unique username, email, and password.
- Passwords are hashed with **bcrypt** (min cost factor 12) before storage.
- Login returns a signed **JWT** (access token: 15min TTL, refresh token: 7 days).
- Token refresh endpoint to maintain active sessions without re-login.
- Session invalidation on logout (refresh token blacklisted in a `token_blacklist` MongoDB collection with a TTL index for automatic expiry).
- Super Admin account is seeded on first boot via environment variable configuration.

**User Stories:**
- *As a new employee, I want to register an account so I can access the platform.*
- *As a user, I want my session to persist across page reloads without re-entering credentials.*

---

### 7.2 Real-Time Messaging & Command System

**Description:** Instant message delivery across rooms using WebSockets, combined with an extensible slash-command system.

**Messaging Requirements:**
- Users connect to rooms via a persistent **WebSocket** connection.
- Messages are broadcast to all connected room members in real time.
- Messages include: sender ID, room ID, timestamp (UTC), content, and message type (text | command | system).
- Disconnected users receive missed messages upon reconnection (via Message History — see 7.4).
- Rooms support **multiple simultaneous users** without message loss.

**Command System Requirements:**

The platform recognises commands prefixed with `/`. Commands are parsed server-side; the client simply sends them as message payloads.

| Command | Role Required | Description |
|---|---|---|
| `/help` | Member | Lists all available commands |
| `/kick <username>` | Moderator+ | Removes a user from the room |
| `/mute <username> <duration>` | Moderator+ | Silences a user for a set duration |
| `/pin <message_id>` | Moderator+ | Pins a message in the room |
| `/poll <question> \| <opt1> \| <opt2>` | Moderator+ | Creates a poll (see Built-in Polls) |
| `/whisper <username> <message>` | Member | Private message within the room (see Advanced Feature 8.3) |
| `/room create <name>` | Moderator+ | Creates a new room |
| `/room temp <name> <duration>` | Moderator+ | Creates a temporary room (see Advanced Feature 8.5) |
| `/lockdown` | Super Admin | Activates lockdown mode (see Advanced Feature 8.1) |
| `/export` | Super Admin | Triggers encrypted migration export (see Advanced Feature 8.2) |

**User Stories:**
- *As a moderator, I want to kick disruptive users from a room using a simple command.*
- *As a member, I want to know what commands are available by typing `/help`.*

---

### 7.3 Typing Indicator

**Description:** Show when another user is actively composing a message in the room.

**Requirements:**
- Client emits a `typing_start` WebSocket event when the user begins typing.
- Client emits a `typing_stop` event when the user stops typing or sends the message.
- Server broadcasts typing status to all other room members (excluding the typist).
- Typing indicator **auto-expires** server-side after **5 seconds** of no update (prevents ghost indicators on disconnect).
- Typing state is stored ephemerally **in-process** on the FastAPI server (not persisted to the database).
- Display format: *"Alice is typing…"* or *"Alice and Bob are typing…"* (up to 3 names; beyond that: *"Several people are typing…"*).

**User Stories:**
- *As a room member, I want to see when someone is about to reply so I don't send a duplicate message.*

---

### 7.4 Message History

**Description:** Persist all messages and allow users to load prior conversation context.

**Requirements:**
- Every message is stored in the **MongoDB** `messages` collection with: `_id`, `room_id`, `sender_id`, `content`, `type`, `created_at`, `deleted_at` (soft delete).
- On room join, the client fetches the last **50 messages** by default.
- Infinite scroll / pagination loads older messages in **50-message batches**.
- Moderators and above can **soft-delete** messages (message displays as *"[Message removed]"* to members).
- Super Admin can **hard-delete** messages (permanent, logged in audit trail).
- Deleted messages are never sent to reconnecting users.
- Message search within a room (full-text search via MongoDB text index on `content` field).

**User Stories:**
- *As a new room joiner, I want to read the recent conversation to understand context.*
- *As a moderator, I want to remove an inappropriate message from the room history.*

---

### 7.5 Built-in Polls

**Description:** Native poll creation and real-time result tracking within rooms.

**Requirements:**
- Polls are created via the `/poll` command or a UI button (Moderator+).
- Poll structure: question, 2–10 options, optional expiry duration, creator, room.
- Each member may **vote once** per poll (vote stored with user ID to enforce uniqueness).
- Results update in **real time** for all room members as votes are cast.
- Poll creator or Moderator can **close a poll** early; closed polls display final results.
- Expired polls (if duration set) are automatically closed by a background task.
- Poll results are **persisted** in MongoDB (not lost on server restart).
- Results are visible to all room members; voter identity is **anonymous** to members (but auditable by Super Admin).

**Poll States:** `open` → `closed` → `archived`

**User Stories:**
- *As a moderator, I want to quickly gauge team opinion on a decision without leaving the platform.*
- *As a member, I want to see live poll results as my teammates vote.*

---

### 7.6 Admin Activity Dashboard

**Description:** A dedicated Super Admin interface for monitoring platform health and user activity.

**Requirements:**
- **Real-time metrics panel:**
  - Active users (total and per room)
  - Active WebSocket connections
  - Messages sent (last 1h / 24h / 7d)
  - Spam events blocked (last 24h)
  - File uploads (count and total size)
- **User management table:**
  - List all users with role, last active, status (active / muted / banned)
  - Actions: promote, demote, ban, unban, force logout
- **Room management panel:**
  - List all rooms with member count, message count, creation date
  - Actions: archive, delete, convert temp room to permanent
- **Audit log:**
  - Timestamped log of all admin actions (role changes, bans, deletions, exports, lockdown events)
  - Filterable by action type, user, date range
  - Exportable as CSV
- **Spam detection log:**
  - Messages flagged or blocked by spam detection
  - Manual review and unblock/confirm actions

**User Stories:**
- *As a Super Admin, I want a single view to understand what is happening across the entire platform.*
- *As a Super Admin, I want an audit trail so I can review any moderation action taken.*

---

## 8. Advanced Features

### 8.1 Lockdown Mode (Local Network Only)

**Description:** An emergency mode that restricts the platform to the local network, blocking all external access.

**Requirements:**
- Activated by Super Admin via `/lockdown` command or dashboard toggle.
- When active, the **Nginx layer** enforces IP allowlist: only requests from the configured internal subnet (e.g., `10.0.0.0/8`, `192.168.0.0/16`) are accepted.
- External connections are dropped with a `403 Forbidden` response.
- All existing external WebSocket connections are **gracefully terminated** with a system message: *"Platform has entered lockdown mode. External access is restricted."*
- Lockdown state is stored in a **MongoDB** `system_config` document and watched via Change Stream for instant propagation across all server instances.
- Lockdown can be **deactivated** only by Super Admin.
- All lockdown activation/deactivation events are written to the audit log with timestamp and actor.

**Configuration:**
```yaml
# config/lockdown.yaml
lockdown:
  enabled: false
  allowed_subnets:
    - "10.0.0.0/8"
    - "192.168.0.0/16"
  notify_users: true
```

**User Stories:**
- *As a Super Admin, I want to instantly restrict the platform to local network access during a security incident.*

---

### 8.2 Encrypted Organisation Migration Bundle

**Description:** Allow an organisation to export its entire structure, history, and configuration as an encrypted file for seamless migration to a new server or network.

**Requirements:**

**Export:**
- Super Admin triggers export via `/export` command or dashboard.
- Export collects: all users (hashed passwords, roles), all rooms (metadata, settings), full message history, poll data, file attachment metadata (not binaries by default; binary inclusion optional), role assignments, and audit logs.
- Data is serialised to **JSON**, then compressed (gzip), then encrypted with **AES-256-GCM**.
- Encryption key is derived from a **passphrase** entered by the Super Admin at export time (PBKDF2 with SHA-256, 600,000 iterations).
- Output: a single `.inm` (Internal Network Migration) file with embedded metadata header (version, org name, export timestamp, file count).
- Export is logged in the audit trail.

**Import:**
- On a fresh install, the setup wizard detects the absence of a database and offers an import option.
- Super Admin uploads the `.inm` file and enters the passphrase.
- System decrypts, decompresses, validates schema version, and restores all data.
- Conflicting records (if partially initialised) are flagged for manual resolution.
- Import progress is shown in real time.

**Migration Bundle Structure:**
```
migration.inm
├── [header]       version, timestamp, org_name, checksum
├── [encrypted payload]
│   ├── users.json
│   ├── roles.json
│   ├── rooms.json
│   ├── messages.json
│   ├── polls.json
│   ├── audit_log.json
│   └── [optional] files/
```

**User Stories:**
- *As a Super Admin, I want to move our entire organisation to a new server without losing any history or configuration.*
- *As a new server admin, I want to onboard a migrating organisation simply by providing their encrypted bundle.*

---

### 8.3 In-Room Private Messaging (`/whisper`)

**Description:** Send a private message to a specific user within a room without opening a separate DM thread.

**Requirements:**
- Syntax: `/whisper <username> <message>`
- The whisper is **only delivered** to the target user and visible to the sender in the room view.
- Whispers are visually distinguished in the UI (e.g., italic text, purple tint, labelled *"whisper to [name]"* / *"whisper from [name]"*).
- Whispers are **not broadcast** to other room members and not stored in the room's public message history.
- Whispers **are stored** in a separate `whispers` MongoDB collection for audit purposes (accessible only to Super Admin).
- If the target user is not in the room at time of whisper, the sender receives a system error: *"[username] is not currently in this room."*
- Moderators cannot intercept whispers in real time; only Super Admin can review via audit log.
- Whispers count toward the sender's **rate limit** (same as regular messages).

**User Stories:**
- *As a developer, I want to quietly ask a colleague a question during a meeting discussion without derailing the room.*

---

### 8.4 Rate Limiting, Spam Detection, Encrypted File Sharing & Load Balancing

#### 8.4.1 Rate Limiting (Anti-Spam Protection)

**Requirements:**
- Per-user message rate limit: **20 messages per 10-second window** (configurable).
- Limits tracked **in-process** using a sliding window counter (per FastAPI instance; configurable shared enforcement via MongoDB `rate_limits` collection with TTL indexes for multi-instance deployments).
- Users exceeding the limit receive a system warning: *"Slow down. You are sending messages too quickly."*
- After 3 consecutive violations, the user is **auto-muted** for 5 minutes.
- Mute escalates to a 1-hour auto-mute after 3 mute events in a 24-hour window.
- Super Admin and Moderators have elevated limits (configurable, default 5x).
- All rate-limit events are logged.

#### 8.4.2 Smart Spam Detection

**Requirements:**
- Pattern-based detection (configurable regex blocklist for known spam patterns).
- **Repetition detection:** flags messages with >80% similarity to the user's last 5 messages.
- **Flood detection:** more than 5 identical or near-identical messages across the room within 30 seconds flags all as spam.
- **Link scanning:** URLs in messages are checked against a configurable domain blocklist.
- Flagged messages are held in a moderation queue (not delivered) and visible on the Admin Dashboard.
- Moderators can approve (deliver) or reject (delete) flagged messages.
- False positives can be reported by users; reported false positives appear in the Admin Dashboard for review.

#### 8.4.3 Encrypted File Sharing

**Requirements:**
- Members can attach files to messages (drag-and-drop or file picker).
- Supported types: PDF, DOCX, PNG, JPG, ZIP, TXT (configurable allowlist).
- Max file size: **25 MB** per file (configurable per room).
- Files are encrypted at rest with **AES-256** before storage in MinIO.
- File access requires a valid JWT; download URLs are **pre-signed, time-limited** (15-minute expiry).
- File metadata (uploader, room, timestamp, filename, size) stored in MongoDB `files` collection.
- Moderators can delete files from their rooms; Super Admin can delete any file.
- Virus scanning integration hook (pluggable; default: ClamAV).

#### 8.4.4 Load Balancing

**Requirements:**
- Nginx acts as the primary **Layer 7 load balancer** distributing HTTP and WebSocket traffic across multiple FastAPI instances.
- WebSocket connections are **sticky** per user session (consistent hashing on user ID) to ensure the same server handles a user's connection for its duration.
- **MongoDB Change Streams** ensure messages written on one server instance are **broadcast** to connected clients on all other instances in real time.
- Health checks: Nginx polls each backend instance every 10 seconds; unhealthy instances are removed from the pool automatically.
- Horizontal scaling: new FastAPI instances can be added to the Nginx upstream pool without downtime.

---

### 8.5 Temporary Rooms

**Description:** Rooms that automatically expire and are archived after a set duration.

**Requirements:**
- Created via: `/room temp <name> <duration>` (e.g., `/room temp sprint-review 2h`).
- Supported duration units: `m` (minutes), `h` (hours), `d` (days). Maximum: **30 days**.
- Room displays a **countdown timer** visible to all members.
- Warnings are broadcast to the room at: 1 hour remaining, 30 minutes, 10 minutes, and 1 minute.
- On expiry:
  - No new messages can be sent.
  - Room status changes to `archived`.
  - All members are notified with a system message: *"This room has expired and is now archived."*
  - Message history remains readable for 30 days post-expiry, then is soft-deleted.
- Super Admin can **extend** a temporary room's duration or **convert** it to a permanent room via the dashboard.
- Temp room expiry is handled by a **background scheduler** (APScheduler or Celery Beat) — not dependent on active connections.

**User Stories:**
- *As a moderator, I want to create a short-lived room for a specific incident response that cleans itself up afterwards.*
- *As a member, I want to be warned before a temporary room closes so I can save any important information.*

---

## 9. Database Schema (High-Level)

All data is stored in a single MongoDB database (`internal_network_db`). Collections use `ObjectId` as `_id`. Indexes noted inline.

```js
// ── users ──────────────────────────────────────────────────────────────────
{
  _id: ObjectId,
  username: String,          // unique index
  email: String,             // unique index
  password_hash: String,
  role: "super_admin" | "moderator" | "member",
  is_banned: Boolean,
  created_at: Date,
  last_active: Date
}

// ── rooms ──────────────────────────────────────────────────────────────────
{
  _id: ObjectId,
  name: String,
  type: "permanent" | "temporary",
  created_by: ObjectId,      // ref: users
  status: "active" | "archived",
  expires_at: Date | null,   // TTL index (temporary rooms)
  member_ids: [ObjectId],    // ref: users
  created_at: Date
}

// ── messages ───────────────────────────────────────────────────────────────
// Index: { room_id: 1, created_at: -1 }
// Text index: { content: "text" }   ← full-text search
{
  _id: ObjectId,
  room_id: ObjectId,         // ref: rooms
  sender_id: ObjectId,       // ref: users
  content: String,
  type: "text" | "command" | "system",
  created_at: Date,
  deleted_at: Date | null    // null = active
}

// ── whispers ───────────────────────────────────────────────────────────────
// Index: { room_id: 1, sender_id: 1 }
{
  _id: ObjectId,
  room_id: ObjectId,
  sender_id: ObjectId,
  recipient_id: ObjectId,
  content: String,
  sent_at: Date
}

// ── polls ──────────────────────────────────────────────────────────────────
// Options and votes embedded — avoids collection-per-vote overhead
{
  _id: ObjectId,
  room_id: ObjectId,
  created_by: ObjectId,
  question: String,
  status: "open" | "closed" | "archived",
  options: [
    {
      option_id: ObjectId,
      text: String,
      vote_count: Number,
      voter_ids: [ObjectId]  // enforces one-vote-per-user
    }
  ],
  created_at: Date,
  expires_at: Date | null,
  closed_at: Date | null
}

// ── files ──────────────────────────────────────────────────────────────────
{
  _id: ObjectId,
  room_id: ObjectId,
  uploader_id: ObjectId,
  filename: String,
  storage_key: String,       // MinIO object key
  size_bytes: Number,
  mime_type: String,
  uploaded_at: Date,
  deleted_at: Date | null
}

// ── audit_log ──────────────────────────────────────────────────────────────
// Index: { created_at: -1 }, { actor_id: 1 }, { action: 1 }
{
  _id: ObjectId,
  actor_id: ObjectId,
  action: String,            // e.g. "ban_user", "lockdown_enable"
  target_type: String,       // "user" | "room" | "message" | "system"
  target_id: ObjectId | null,
  metadata: Object,          // arbitrary context (old/new values etc.)
  created_at: Date
}

// ── token_blacklist ────────────────────────────────────────────────────────
// TTL index: { expires_at: 1 } — documents auto-deleted on expiry
{
  _id: ObjectId,
  token_jti: String,         // unique index
  user_id: ObjectId,
  expires_at: Date
}

// ── rate_limits ────────────────────────────────────────────────────────────
// TTL index: { window_start: 1 }
{
  _id: ObjectId,
  user_id: ObjectId,         // unique index
  window_start: Date,
  message_count: Number,
  violation_count: Number
}

// ── system_config ──────────────────────────────────────────────────────────
// Single document; watched via Change Stream for lockdown propagation
{
  _id: "global",
  lockdown_enabled: Boolean,
  lockdown_updated_at: Date,
  lockdown_updated_by: ObjectId
}
```

---

## 10. API Endpoints (High-Level)

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT pair |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List accessible rooms |
| POST | `/api/rooms` | Create room (Moderator+) |
| GET | `/api/rooms/{id}` | Get room details |
| PATCH | `/api/rooms/{id}` | Update room (Moderator+) |
| DELETE | `/api/rooms/{id}` | Archive room (Admin) |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms/{id}/messages` | Paginated message history |
| DELETE | `/api/messages/{id}` | Soft-delete message (Moderator+) |
| GET | `/api/rooms/{id}/search` | Full-text message search |

### Polls
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rooms/{id}/polls` | Create poll |
| GET | `/api/rooms/{id}/polls` | List room polls |
| POST | `/api/polls/{id}/vote` | Cast vote |
| PATCH | `/api/polls/{id}/close` | Close poll (creator or Moderator+) |

### Files
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rooms/{id}/files` | Upload file |
| GET | `/api/files/{id}/download` | Get pre-signed download URL |
| DELETE | `/api/files/{id}` | Delete file (Moderator+) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform metrics |
| GET | `/api/admin/users` | User management list |
| PATCH | `/api/admin/users/{id}` | Update user role/status |
| GET | `/api/admin/audit` | Audit log (filterable) |
| POST | `/api/admin/lockdown` | Toggle lockdown mode |
| POST | `/api/admin/export` | Trigger migration export |
| POST | `/api/admin/import` | Import migration bundle |

### WebSocket
| Endpoint | Description |
|---|---|
| `WS /ws/{room_id}` | Real-time room connection |

**WebSocket Event Types:**

```json
// Client → Server
{ "type": "message",       "content": "Hello" }
{ "type": "typing_start" }
{ "type": "typing_stop" }
{ "type": "command",       "content": "/poll Who leads? | Alice | Bob" }

// Server → Client
{ "type": "message",       "sender": "alice", "content": "Hello", "timestamp": "..." }
{ "type": "typing",        "user": "bob",     "status": "start" }
{ "type": "system",        "content": "Bob has joined the room." }
{ "type": "poll_update",   "poll_id": "...",  "results": {...} }
{ "type": "error",         "code": 429,       "message": "Rate limit exceeded." }
```

---

## 11. Security Considerations

| Area | Measure |
|---|---|
| Passwords | bcrypt, min cost 12; no plaintext ever stored or logged |
| Tokens | JWT signed with RS256; refresh tokens stored in HttpOnly cookies |
| Transport | TLS 1.3 enforced on all connections; HTTP redirects to HTTPS |
| File storage | AES-256 at rest; pre-signed, time-limited download URLs |
| Migration bundle | AES-256-GCM; PBKDF2 key derivation; integrity checksum |
| Input validation | All inputs sanitised server-side; Pydantic models enforce types; no raw query injection via ODM |
| Role enforcement | All role checks performed server-side; client role claims ignored |
| Audit trail | Immutable append-only log; only Super Admin can view |
| Lockdown | Enforced at Nginx layer; not bypassable by application code |
| WebSocket auth | JWT validated on connection upgrade; re-validated on sensitive commands |
| Whispers | Not in room broadcast; separate storage with restricted access |

---

## 12. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Message delivery latency | < 200ms (p95) under 1,000 concurrent users |
| API response time | < 100ms (p95) for read endpoints |
| WebSocket reconnection | Automatic client reconnect with exponential backoff |
| Database | MongoDB replica set for high availability; secondary reads for history/search queries |
| Backup | Daily automated MongoDB backup (mongodump); 30-day retention |
| Browser support | Chrome, Firefox, Safari, Edge (last 2 major versions) |
| Accessibility | WCAG 2.1 AA compliance |
| Logging | Structured JSON logs (ELK or equivalent) |
| Observability | Prometheus metrics + Grafana dashboards for all services |

---

## 13. Milestones & Phased Rollout

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Project scaffolding (React + FastAPI + MongoDB + Beanie ODM)
- [ ] User authentication (register, login, JWT, refresh)
- [ ] Basic room creation and membership
- [ ] WebSocket connection and real-time messaging
- [ ] Message history with pagination
- [ ] Typing indicator

### Phase 2 — Core Features (Weeks 5–8)
- [ ] Command system (parser + `/help`, `/kick`, `/mute`, `/pin`)
- [ ] Built-in polls (creation, voting, real-time results)
- [ ] Role-based permission enforcement
- [ ] Admin activity dashboard (basic metrics + user management)
- [ ] Rate limiting

### Phase 3 — Advanced Features (Weeks 9–13)
- [ ] `/whisper` command and in-room private messaging
- [ ] Encrypted file sharing
- [ ] Temporary rooms with expiry scheduler
- [ ] Smart spam detection
- [ ] Lockdown mode

### Phase 4 — Resilience & Migration (Weeks 14–17)
- [ ] Load balancing with sticky WebSocket sessions
- [ ] Encrypted migration bundle export/import
- [ ] Full audit log
- [ ] Virus scanning integration
- [ ] Performance testing and optimisation

### Phase 5 — Hardening & Launch (Weeks 18–20)
- [ ] Security audit and penetration testing
- [ ] Accessibility review
- [ ] Documentation (API docs, admin guide, user guide)
- [ ] Staging environment validation
- [ ] Production rollout

---

## 14. Open Questions & Risks

| # | Question / Risk | Owner | Status |
|---|---|---|---|
| 1 | What is the target maximum concurrent user count for initial deployment? | Product | Open |
| 2 | Should message history be retained indefinitely or with a configurable retention policy? | Legal / Security | Open |
| 3 | Is the virus scanning integration (ClamAV) acceptable, or is a commercial scanner required? | Security | Open |
| 4 | Should the migration bundle optionally include file binaries, and what is the max acceptable bundle size? | Engineering | Open |
| 5 | Risk: WebSocket connection storms on reconnect after a server restart — mitigate with jitter in reconnect backoff | Engineering | Mitigating |
| 6 | Risk: AES key management for file storage — KMS integration may be required for compliance | Security | Open |
| 7 | Are there regulatory requirements (GDPR, SOC 2) that affect data retention or audit log access? | Legal | Open |
| 8 | Should whispers be included in the migration bundle or excluded for privacy? | Product / Legal | Open |

---

*This document is a living PRD and will be updated as requirements are clarified. All section owners should review and sign off before Phase 1 development begins.*
