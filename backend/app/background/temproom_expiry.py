"""Background scheduler for temp room expiry checks."""
import asyncio
import time

from app.db.mongo import rooms_col, temprooms_col


async def expire_temp_rooms():
    """Lock and archive temp rooms that have passed their expiry time."""
    from app.websockets.socket_manager import emit_room_expired

    now = int(time.time() * 1000)
    cursor = temprooms_col().find({"locked": {"$ne": True}, "expires_at": {"$lte": now}})
    async for temp in cursor:
        room_id = temp.get("room_id")
        await temprooms_col().update_one(
            {"_id": temp["_id"]},
            {"$set": {"locked": True}}
        )
        if room_id:
            await rooms_col().update_one(
                {"_id": temp["_id"]},  # handled by room_id string
                {"$set": {"archived": True}}
            )
            await emit_room_expired(room_id)


async def run_scheduler():
    """Run expiry check every 30 seconds."""
    while True:
        try:
            await expire_temp_rooms()
        except Exception as exc:
            print(f"[scheduler] error: {exc}")
        await asyncio.sleep(30)
