import pytest


@pytest.mark.asyncio
async def test_metrics_admin_only(client, admin_headers, user_headers):
    resp_user = await client.get("/api/admin/metrics", headers=user_headers)
    assert resp_user.status_code == 403

    resp_admin = await client.get("/api/admin/metrics", headers=admin_headers)
    assert resp_admin.status_code == 200
    data = resp_admin.json()
    assert "onlineUsers" in data
    assert "messagesPerMinute" in data
    assert "tempRooms" in data
    assert "spamAlerts" in data


@pytest.mark.asyncio
async def test_audit_log_admin_only(client, admin_headers, user_headers):
    resp_user = await client.get("/api/admin/audit-log", headers=user_headers)
    assert resp_user.status_code == 403

    resp_admin = await client.get("/api/admin/audit-log", headers=admin_headers)
    assert resp_admin.status_code == 200
    assert isinstance(resp_admin.json(), list)


@pytest.mark.asyncio
async def test_list_users_admin(client, admin_headers, user_headers):
    # Register an extra user
    await client.post("/api/auth/register", json={
        "name": "Extra",
        "email": "extra@test.com",
        "password": "pass",
    })

    users_resp = await client.get("/api/admin/users", headers=admin_headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    emails = [u["email"] for u in users]
    assert "extra@test.com" in emails


@pytest.mark.asyncio
async def test_update_user_role(client, admin_headers, user_headers):
    me_resp = await client.get("/api/auth/me", headers=user_headers)
    user_id = me_resp.json()["id"]

    update_resp = await client.put(
        f"/api/admin/users/{user_id}/role",
        json={"org_role": "room_supervisor"},
        headers=admin_headers,
    )
    assert update_resp.status_code == 200

    # Verify the change
    me_again = await client.get("/api/auth/me", headers=user_headers)
    assert me_again.json()["org_role"] == "room_supervisor"
