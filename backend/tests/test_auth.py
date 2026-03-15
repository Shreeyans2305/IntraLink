import pytest


# ── Org setup ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_org_setup(client):
    resp = await client.post("/api/org/setup", json={
        "org_name": "Acme Corp",
        "admin_name": "Alice Admin",
        "admin_email": "alice@acme.com",
        "admin_password": "secure123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["user"]["org_role"] == "admin"
    assert "id" in data["org"]  # ID of the generated org Should be returned
    assert data["org"]["name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_org_setup_twice_returns_409(client):
    payload = {
        "org_name": "Acme Corp",
        "admin_name": "Alice Admin",
        "admin_email": "alice@acme.com",
        "admin_password": "secure123",
    }
    await client.post("/api/org/setup", json=payload)
    resp = await client.post("/api/org/setup", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_org_status_before_setup(client):
    resp = await client.get("/api/org/")
    assert resp.status_code == 200
    assert resp.json()["orgs"] == []


@pytest.mark.asyncio
async def test_org_status_after_setup(client):
    await client.post("/api/org/setup", json={
        "org_name": "My Org",
        "admin_name": "Admin",
        "admin_email": "admin@myorg.com",
        "admin_password": "pass1234",
    })
    resp = await client.get("/api/org/")
    assert len(resp.json()["orgs"]) == 1
    assert resp.json()["orgs"][0]["name"] == "My Org"


# ── Registration (invite-only) ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_without_org_returns_400(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@test.com",
        "password": "securepass",
        "org_id": "507f1f77bcf86cd799439011", # Sample false object ID
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_register_without_whitelist_returns_403(client, admin_token):
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]
    
    resp = await client.post("/api/auth/register", json={
        "name": "Bob",
        "email": "bob@test.com",
        "password": "pass",
        "org_id": org_id,
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_register_with_whitelist(client, admin_token):
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]
    
    await client.post("/api/admin/whitelist", json={
        "email": "alice@test.com",
        "org_role": "user",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    resp = await client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@test.com",
        "password": "securepass",
        "org_id": org_id,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "alice@test.com"
    assert data["user"]["org_role"] == "user"
    assert "hashed_password" not in data["user"]


@pytest.mark.asyncio
async def test_register_room_manager_role(client, admin_token):
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]
    
    await client.post("/api/admin/whitelist", json={
        "email": "mgr@test.com",
        "org_role": "room_manager",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    resp = await client.post("/api/auth/register", json={
        "name": "Manager",
        "email": "mgr@test.com",
        "password": "pass1234",
        "org_id": org_id,
    })
    assert resp.status_code == 201
    assert resp.json()["user"]["org_role"] == "room_manager"


@pytest.mark.asyncio
async def test_register_whitelist_consumed(client, admin_token):
    """Whitelist is deleted after successful registration – cannot register twice."""
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]
    
    await client.post("/api/admin/whitelist", json={
        "email": "carol@test.com",
        "org_role": "user",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    await client.post("/api/auth/register", json={
        "name": "Carol",
        "email": "carol@test.com",
        "password": "pass1",
        "org_id": org_id,
    })
    # Second registration with same email should fail (duplicate)
    resp = await client.post("/api/auth/register", json={
        "name": "Carol2",
        "email": "carol@test.com",
        "password": "pass2",
        "org_id": org_id,
    })
    assert resp.status_code == 403


# ── Login ────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client, admin_token):
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]
    
    resp = await client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "test1234",
        "org_id": org_id,
    })
    assert resp.status_code == 200
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, admin_token):
    org_resp = await client.get("/api/org/")
    org_id = org_resp.json()["orgs"][0]["id"]

    resp = await client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "wrong",
        "org_id": org_id,
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client, admin_token):
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
