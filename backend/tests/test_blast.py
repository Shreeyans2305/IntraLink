import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.db.mongo import messages_col, rooms_col
from main import socket_app

@pytest.mark.asyncio
async def test_blast_and_restore(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a room
    room_resp = await client.post("/api/rooms/", json={"name": "testroom", "type": "standard"}, headers=headers)
    assert room_resp.status_code == 201
    
    # Blast
    resp = await client.post("/api/admin/blast", json={"passphrase": "supersecret"}, headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/octet-stream"
    
    blueprint_data = resp.read()
    
    # Verify DB wiped
    rooms = await rooms_col().count_documents({})
    assert rooms == 0
    msgs = await messages_col().count_documents({})
    assert msgs == 0
    
    # Restore
    import base64
    b64 = base64.b64encode(blueprint_data).decode("utf-8")
    
    restore_resp = await client.post("/api/admin/import-blueprint", json={
        "data": b64,
        "passphrase": "supersecret"
    }, headers=headers)
    assert restore_resp.status_code == 200
    
    res_json = restore_resp.json()
    assert res_json["ok"] is True
    assert res_json["rooms_created"] >= 1
    
    rooms_after = await rooms_col().count_documents({})
    assert rooms_after >= 1
