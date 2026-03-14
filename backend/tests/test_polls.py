import pytest


@pytest.mark.asyncio
async def test_create_and_list_poll(client, admin_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "poll-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]

    poll_resp = await client.post(
        f"/api/rooms/{room_id}/polls/",
        json={"question": "Yes or No?", "options": [{"label": "Yes"}, {"label": "No"}]},
        headers=admin_headers,
    )
    assert poll_resp.status_code == 201
    poll = poll_resp.json()
    assert poll["question"] == "Yes or No?"
    assert len(poll["options"]) == 2

    list_resp = await client.get(f"/api/rooms/{room_id}/polls/", headers=admin_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


@pytest.mark.asyncio
async def test_vote_poll(client, admin_headers, user_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "vote-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]
    await client.post(f"/api/rooms/{room_id}/join", headers=user_headers)

    poll_resp = await client.post(
        f"/api/rooms/{room_id}/polls/",
        json={"question": "A or B?", "options": [{"label": "A"}, {"label": "B"}]},
        headers=admin_headers,
    )
    poll = poll_resp.json()
    poll_id = poll["id"]
    option_id = poll["options"][0]["id"]

    vote_resp = await client.post(
        f"/api/rooms/{room_id}/polls/{poll_id}/vote",
        json={"option_id": option_id},
        headers=user_headers,
    )
    assert vote_resp.status_code == 200
    updated = vote_resp.json()
    opt = next(o for o in updated["options"] if o["id"] == option_id)
    assert opt["votes"] == 1


@pytest.mark.asyncio
async def test_double_vote_blocked(client, admin_headers):
    create_resp = await client.post("/api/rooms/", json={"name": "double-vote-room"}, headers=admin_headers)
    room_id = create_resp.json()["id"]

    poll_resp = await client.post(
        f"/api/rooms/{room_id}/polls/",
        json={"question": "Q?", "options": [{"label": "Opt1"}]},
        headers=admin_headers,
    )
    poll = poll_resp.json()
    poll_id = poll["id"]
    option_id = poll["options"][0]["id"]

    await client.post(
        f"/api/rooms/{room_id}/polls/{poll_id}/vote",
        json={"option_id": option_id},
        headers=admin_headers,
    )
    resp2 = await client.post(
        f"/api/rooms/{room_id}/polls/{poll_id}/vote",
        json={"option_id": option_id},
        headers=admin_headers,
    )
    assert resp2.status_code == 400
