import asyncio
import time

import httpx
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongo import close_client, get_client

_START_TIME = time.time()
from app.routers import admin, auth, messages, org, polls, presence, reactions, rooms, search, temprooms, threads
from app.websockets.socket_manager import _load_lockdown_state, sio
from app.background.temproom_expiry import run_scheduler
from app.middleware.lockdown import lockdown_middleware

# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(title="IntraLink API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
app.add_middleware(BaseHTTPMiddleware, dispatch=lockdown_middleware)

# ── Register all REST routers under /api prefix ───────────────────────────────

for router_module in [org, auth, rooms, messages, threads, reactions, polls, temprooms, presence, admin, search]:
    app.include_router(router_module.router, prefix="/api")

# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    # Ensure MongoDB indexes
    client = get_client()
    db = client[settings.MONGO_DB]
    await db["users"].create_index("email", unique=True)
    await db["messages"].create_index("room_id")
    await db["messages"].create_index("timestamp")
    await db["threads"].create_index("parent_message_id")
    await db["reactions"].create_index("message_id", unique=True)
    await db["polls"].create_index("room_id")
    await db["audit_logs"].create_index("timestamp")
    await db["temprooms"].create_index("expires_at")
    # Load persisted lockdown state from DB
    await _load_lockdown_state()
    # Start background scheduler
    asyncio.create_task(run_scheduler())
    # Start self-ping to prevent Render cold-start spin-down
    if settings.PUBLIC_URL:
        asyncio.create_task(_self_ping_loop())
        print(f"Self-ping enabled → {settings.PUBLIC_URL}/health every {settings.SELF_PING_INTERVAL_SECONDS}s")
    print("IntraLink API started ✓")


@app.on_event("shutdown")
async def shutdown():
    await close_client()
    print("IntraLink API stopped")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Detailed health check — safe to use as uptime-monitor target."""
    db_ok = False
    try:
        client = get_client()
        await client.admin.command("ping")
        db_ok = True
    except Exception:  # pragma: no cover
        pass

    uptime_seconds = int(time.time() - _START_TIME)
    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "unreachable",
        "uptime_seconds": uptime_seconds,
        "version": "1.0.0",
    }


# ── Self-ping loop (keeps Render free tier awake) ──────────────────────────────

async def _self_ping_loop():
    await asyncio.sleep(60)          # initial delay — wait for full startup
    async with httpx.AsyncClient(timeout=10) as client:
        while True:
            try:
                await client.get(f"{settings.PUBLIC_URL.rstrip('/')}/health")
            except Exception:        # pragma: no cover
                pass                 # silently ignore — server may be mid-restart
            await asyncio.sleep(settings.SELF_PING_INTERVAL_SECONDS)


# ── Mount Socket.IO on same ASGI app so they share port 8000 ─────────────────

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
