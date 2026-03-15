from fastapi import Request, HTTPException

# Local import to avoid circular dependency
def is_lockdown_active():
    from app.websockets.socket_manager import _lockdown_active
    return _lockdown_active

async def lockdown_middleware(request: Request, call_next):
    # Allow admin routes and essential auth routes
    path = request.url.path
    if path.startswith("/api/admin") or path.startswith("/api/auth") or path.startswith("/api/org"):
        return await call_next(request)

    # For everything else, block if lockdown is active
    if is_lockdown_active():
        # Exception handlers return JSON automatically in FastAPI
        raise HTTPException(
            status_code=503,
            detail="System is currently in lockdown mode. All non-admin actions are suspended."
        )

    return await call_next(request)
