# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

IntraLink is a **controlled internal messaging platform** — a self-hosted Slack-like tool for organizations. It has a Python/FastAPI backend and a React frontend, both in this monorepo under `backend/` and `frontend/`.

## Commands

### Backend

All backend commands should be run from the `backend/` directory with the virtualenv activated (`source venv/bin/activate`).

```bash
# Install dependencies
pip install -r requirements.txt

# Run the dev server (serves REST + Socket.IO together on port 8000)
uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000

# Run all tests (no MongoDB required — uses mongomock-motor)
pytest

# Run a single test file
pytest tests/test_auth.py

# Run a single test by name
pytest tests/test_auth.py::test_register
```

### Frontend

All frontend commands should be run from the `frontend/` directory.

```bash
# Install dependencies
npm install

# Start dev server (proxies /api and /socket.io to localhost:8000)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Environment Variables

**Backend** (`backend/.env`):
- `MONGO_URL` — MongoDB connection string (default: `mongodb://localhost:27017`)
- `MONGO_DB` — database name (default: `intralink`)
- `SECRET_KEY` — JWT signing secret
- `CORS_ORIGINS` — comma-separated allowed origins
- `USE_MOCK_DB` — set to `true` to use in-memory mongomock (used by tests automatically)

**Frontend** (`frontend/.env`):
- `VITE_API_URL` — REST API base URL (defaults to `/api`, proxied by Vite to `localhost:8000`)
- `VITE_SOCKET_URL` — Socket.IO server URL (defaults to `window.location.origin`)

## Architecture

### Backend

The backend is a single ASGI app that wraps both FastAPI (REST) and `python-socketio` (WebSocket). The entry point is `main.py`, which mounts the Socket.IO server on top of FastAPI:

```python
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
```

Uvicorn serves `socket_app`, not `app`. This means the Socket.IO and REST endpoints share the same port.

**Layer structure inside `app/`:**
- `routers/` — FastAPI route handlers (one file per domain: auth, rooms, messages, threads, reactions, polls, temprooms, presence, admin, search). All are mounted under `/api`.
- `websockets/socket_manager.py` — All Socket.IO event handlers (`connect`, `send_message`, `join_room`, `typing_start`, `poll_vote`, etc.). Also exports `emit_kick`, `emit_mute`, `emit_room_expired` for REST routers to call when they need to push real-time events.
- `core/deps.py` — FastAPI dependency injection: `get_current_user`, `get_admin_user`, `require_org_role(...)`.
- `core/security.py` — JWT creation/decoding and bcrypt password hashing.
- `db/mongo.py` — Motor client singleton plus collection accessor functions (`users_col()`, `rooms_col()`, etc.). Swaps to `mongomock-motor` when `USE_MOCK_DB=True`.
- `schemas/schemas.py` — All Pydantic request/response models (single file).
- `commands/` — Slash command system: `parser.py` parses `/command args`, `registry.py` maps names to handlers, and `handlers/` contains one file per command (whisper, kick, mute, pin, poll, lockdown, room, export, help).
- `middleware/` — `rate_limiter.py` (per-user rate limiting), `audit_middleware.py`, `lockdown.py` (blocks external traffic when lockdown is active).
- `background/` — `temproom_expiry.py` runs via APScheduler; started as an `asyncio.create_task` at app startup.

**Authentication & Authorization:**
- JWT Bearer tokens are used for both REST (HTTP `Authorization` header) and Socket.IO (passed in the `auth` dict on connect: `{ token: "..." }`).
- Users have an `org_role` field: `"user"`, `"room_supervisor"`, or `"admin"`. **Registration auto-assigns `admin` if the email contains the string `"admin"`** (see `routers/auth.py`).
- Per-room roles are stored on the room document's `members` array: `{ user_id, room_role, muted }`.
- The `get_admin_user` / `require_org_role` dependencies enforce org-level roles; `_check_supervisor_or_admin` in `routers/rooms.py` enforces room-level roles.

**MongoDB collections:** `users`, `rooms`, `messages`, `threads`, `reactions`, `polls`, `temprooms`, `audit_logs`, `notifications`, `whispers`.

### Frontend

Single-page React 19 app using Vite. State is split between:
- **Redux Toolkit** (`src/store/store.js`) — for all in-memory UI state. Slices are organized per feature domain: `auth`, `messaging`, `temprooms`, `threads`, `reactions`, `presence`, `notifications`, `ai`, `polls`, `admin`, `files`.
- **React Query** — for data fetching/caching from the REST API.
- **Socket.IO client** (`src/services/websocket.js`) — singleton socket instance; consumers call `getSocket()` / `connectSocket()`. The socket authenticates by passing `{ token }` in the `auth` option on connect.

**Key wiring:**
- `src/services/apiClient.js` — axios instance; `setApiAuthToken(token)` must be called after login to inject the Bearer token into all subsequent requests.
- `src/routes/AppRouter.jsx` — routes: `/login`, `/register`, `/chat` (protected), `/user/bookmarks`, `/user/preferences`, and `/admin/*` (admin-only) via `ProtectedRoute` and `AdminRoute` wrappers.
- `src/App.jsx` — applies user preferences (`theme`, `density`, `reducedMotion`) as `data-*` attributes on `<html>` for CSS theming.
- Internationalization via `i18next` / `react-i18next`, initialized in `src/i18n.js`.

**Feature structure:** Each feature under `src/features/<domain>/` typically contains a Redux slice (`<domain>Slice.js`) and may include components, hooks, or service calls. UI components live in `src/components/<domain>/`.

### Real-time Event Flow

1. Client connects Socket.IO with `{ auth: { token } }`.
2. Server validates JWT and registers `sid → user` in in-memory maps (`_sid_user`, `_user_sids`).
3. Client emits `join_room` with `{ room_id }` to subscribe to a room's events.
4. Messages, reactions, threads, and poll votes are sent via Socket.IO events (not REST) and persisted in MongoDB inside the socket handlers.
5. When REST actions (kick, mute) need to push to clients, routers call `emit_kick` / `emit_mute` from `websockets/socket_manager.py`.

### Testing

Tests live in `backend/tests/`. The `conftest.py` fixture `mock_mongo` (autouse) patches the Motor client with an in-memory `AsyncMongoMockClient` before each test and drops all collections after. Tests use `httpx.AsyncClient` with `ASGITransport` against `socket_app`. The `asyncio_mode = auto` in `pytest.ini` means all `async def` tests run automatically.
