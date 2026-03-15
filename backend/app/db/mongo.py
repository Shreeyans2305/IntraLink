from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Any

try:
    from mongomock_motor import AsyncMongoMockClient
except Exception:  # pragma: no cover
    AsyncMongoMockClient = None

_client: Any = None


def get_client() -> Any:
    global _client
    if _client is None:
        if settings.USE_MOCK_DB:
            if AsyncMongoMockClient is None:
                raise RuntimeError("USE_MOCK_DB=true requires mongomock-motor to be installed")
            _client = AsyncMongoMockClient()
        else:
            _client = AsyncIOMotorClient(settings.MONGO_URL)
    return _client


def get_database():
    return get_client()[settings.MONGO_DB]


# Collection helpers
def users_col():
    return get_database()["users"]


def rooms_col():
    return get_database()["rooms"]


def messages_col():
    return get_database()["messages"]


def threads_col():
    return get_database()["threads"]


def reactions_col():
    return get_database()["reactions"]


def polls_col():
    return get_database()["polls"]


def temprooms_col():
    return get_database()["temprooms"]


def audit_col():
    return get_database()["audit_logs"]


def notifications_col():
    return get_database()["notifications"]


def org_col():
    return get_database()["organizations"]


def whitelists_col():
    return get_database()["whitelists"]


def system_config_col():
    return get_database()["system_config"]


async def close_client():
    global _client
    if _client:
        _client.close()
        _client = None
