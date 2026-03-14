import pytest


@pytest.mark.asyncio
async def test_create_room_admin(client, admin_headers):
    resp = await client.post("/api/rooms/", json={"name": "test-room"}, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "test-room"
    return data["id"]


@pytest.mark.asyncio
async def test_create_room_forbidden_for_user(client, user_headers):
    resp = await client.post("/api/rooms/", json={"name": "forbidden"}, headers=user_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_rooms_admin_sees_all(client, admin_headers):
    await client.post("/api/rooms/", json={"name": "room-a"}, headers=admin_headers)
    await client.post("/api/rooms/", json={"name": "room-b"}, headers=admin_headers)
    resp = await client.get("/api/rooms/", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_join_and_list_rooms(client, admin_headers, user_headers):
    # Admin creates a room
    create_resp = await client.post("/api/rooms/", json={"name": "shared"}, headers=admin_headers)
    room_id = create_resp.json()["id"]

    # User joins
    join_resp = await client.post(f"/api/rooms/{room_id}/join", headers=user_headers)
    assert join_resp.status_code == 200

    # User now sees the room
    rooms = await client.get("/api/rooms/", headers=user_headers)
    ids = [r["id"] for r in rooms.json()]
    assert room_id in ids


@pytest.mark.asyncio
async def test_leave_room(client, admin_headers, user_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "to-leave"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    await client.post(f"/api/rooms/{room_id}/join", headers=user_headers)

    leave_resp = await client.delete(f"/api/rooms/{room_id}/leave", headers=user_headers)
    assert leave_resp.status_code == 200


@pytest.mark.asyncio
async def test_kick_member(client, admin_headers, user_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "kick-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    await client.post(f"/api/rooms/{room_id}/join", headers=user_headers)

    # Get user id
    me_resp = await client.get("/api/auth/me", headers=user_headers)
    user_id = me_resp.json()["id"]

    kick_resp = await client.delete(f"/api/rooms/{room_id}/members/{user_id}", headers=admin_headers)
    assert kick_resp.status_code == 200
    assert kick_resp.json()["kicked"] == user_id
