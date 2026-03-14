import pytest


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@test.com",
        "password": "securepass",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "alice@test.com"
    assert "hashed_password" not in data["user"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"name": "Bob", "email": "bob@test.com", "password": "pass"}
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "name": "Carol",
        "email": "carol@test.com",
        "password": "mypassword",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "carol@test.com",
        "password": "mypassword",
    })
    assert resp.status_code == 200
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "name": "Dave",
        "email": "dave@test.com",
        "password": "correct",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "dave@test.com",
        "password": "wrong",
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


@pytest.mark.asyncio
async def test_admin_role_assigned(client):
    resp = await client.post("/api/auth/register", json={
        "name": "AdminPerson",
        "email": "superadmin@org.com",
        "password": "adminpass",
    })
    data = resp.json()
    assert data["user"]["org_role"] == "admin"


@pytest.mark.asyncio
async def test_user_role_assigned(client):
    resp = await client.post("/api/auth/register", json={
        "name": "NormalUser",
        "email": "normal@org.com",
        "password": "userpass",
    })
    data = resp.json()
    assert data["user"]["org_role"] == "user"
