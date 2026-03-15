import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.db.mongo import system_config_col, audit_col
from main import socket_app

@pytest.mark.asyncio
async def test_get_lockdown_status(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.get("/api/admin/lockdown", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == {"active": False}

@pytest.mark.asyncio
async def test_toggle_lockdown(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Enable lockdown
    resp = await client.post("/api/admin/lockdown", json={"active": True}, headers=headers)
    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "active": True}
    
    # Check status
    resp = await client.get("/api/admin/lockdown", headers=headers)
    assert resp.json()["active"] is True
    
    # Disable lockdown
    resp = await client.post("/api/admin/lockdown", json={"active": False}, headers=headers)
    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "active": False}
