import pytest

@pytest.mark.asyncio
async def test_org_isolation(client):
    # 1. Setup Org 1
    resp1 = await client.post("/api/org/setup", json={
        "org_name": "Org One",
        "admin_name": "Admin One",
        "admin_email": "admin1@org1.com",
        "admin_password": "pass1234",
    })
    assert resp1.status_code == 201
    token1 = resp1.json()["token"]
    
    # Get Org 1 ID
    orgs_resp1 = await client.get("/api/org/")
    org1_id = next(o["id"] for o in orgs_resp1.json()["orgs"] if o["name"] == "Org One")

    # 2. Setup Org 2
    resp2 = await client.post("/api/org/setup", json={
        "org_name": "Org Two",
        "admin_name": "Admin Two",
        "admin_email": "admin2@org2.com",
        "admin_password": "pass1234",
    })
    assert resp2.status_code == 201
    token2 = resp2.json()["token"]
    
    # Get Org 2 ID
    orgs_resp2 = await client.get("/api/org/")
    org2_id = next(o["id"] for o in orgs_resp2.json()["orgs"] if o["name"] == "Org Two")

    # 3. Admin 1 creates a room
    room_resp = await client.post("/api/rooms/", json={
        "name": "Secret Room 1",
        "type": "standard"
    }, headers={"Authorization": f"Bearer {token1}"})
    assert room_resp.status_code == 201
    room_id = room_resp.json()["id"]

    # 4. Admin 2 tries to LIST rooms
    # Admin 2 should NOT see Secret Room 1
    list_resp = await client.get("/api/rooms/", headers={"Authorization": f"Bearer {token2}"})
    assert list_resp.status_code == 200
    room_names = [r["name"] for r in list_resp.json()]
    assert "Secret Room 1" not in room_names

    # 5. Admin 2 tries to GET the room directly
    get_resp = await client.get(f"/api/rooms/{room_id}", headers={"Authorization": f"Bearer {token2}"})
    assert get_resp.status_code == 404  # Or 403, but our code raises 404 "not found or access denied"

    # 6. Admin 2 tries to POST a message (via reaction or thread requires message which is missing, but they can't even join)
    join_resp = await client.post(f"/api/rooms/{room_id}/join", headers={"Authorization": f"Bearer {token2}"})
    assert join_resp.status_code == 404

    # 7. Search Isolation
    # Admin 1 searches for "Secret" -> sees room
    search_resp1 = await client.get("/api/search/?q=Secret", headers={"Authorization": f"Bearer {token1}"})
    assert len(search_resp1.json()["rooms"]) > 0

    # Admin 2 searches for "Secret" -> SHOULD NOT see room
    search_resp2 = await client.get("/api/search/?q=Secret", headers={"Authorization": f"Bearer {token2}"})
    assert len(search_resp2.json()["rooms"]) == 0
