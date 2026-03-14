from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
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


async def close_client():
    global _client
    if _client:
        _client.close()
        _client = None
