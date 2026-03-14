"""
Shared pytest fixtures.
Uses mongomock-motor so no real MongoDB is required.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

# Patch motor client before importing app modules
import app.db.mongo as mongo_module


@pytest_asyncio.fixture(autouse=True)
async def mock_mongo(monkeypatch):
    """Replace Motor client with an in-memory mongomock client."""
    mock_client = AsyncMongoMockClient()
    monkeypatch.setattr(mongo_module, "_client", mock_client)
    yield mock_client
    # Clean up collections between tests
    db = mock_client[mongo_module.settings.MONGO_DB]
    for col_name in await db.list_collection_names():
        await db.drop_collection(col_name)


@pytest_asyncio.fixture
async def client():
    from main import socket_app
    async with AsyncClient(transport=ASGITransport(app=socket_app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_token(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Admin User",
        "email": "admin@test.com",
        "password": "test1234",
    })
    assert resp.status_code == 201
    return resp.json()["token"]


@pytest_asyncio.fixture
async def user_token(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Regular User",
        "email": "user@test.com",
        "password": "test1234",
    })
    assert resp.status_code == 201
    return resp.json()["token"]


@pytest_asyncio.fixture
async def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
async def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}
