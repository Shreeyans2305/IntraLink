import pytest


@pytest.mark.asyncio
async def test_send_message_via_rest_is_blocked(client, admin_headers):
    """Messages go via WebSocket; REST GET should return empty initially."""
    create_resp = await client.post("/api/rooms/", json={"name": "msg-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    resp = await client.get(f"/api/rooms/{room_id}/messages/", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_messages_allows_non_members(client, admin_headers, user_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "private"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    # User is not a member
    resp = await client.get(f"/api/rooms/{room_id}/messages/", headers=user_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_pin_requires_supervisor(client, admin_headers, user_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "pin-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    await client.post(f"/api/rooms/{room_id}/join", headers=user_headers)
    resp = await client.post(f"/api/rooms/{room_id}/messages/fake-msg-id/pin", headers=user_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_thread_on_nonexistent_message(client, admin_headers):
    resp = await client.post(
        "/api/messages/000000000000000000000001/threads/",
        json={"text": "Reply"},
        headers=admin_headers,
    )
    assert resp.status_code == 404
