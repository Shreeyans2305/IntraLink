from pymongo import MongoClient

def migrate():
    client = MongoClient("mongodb://localhost:27017")
    db = client["intralink"]
    
    # 1. Update whitelists (org_role)
    wl_result = db.whitelists.update_many(
        {"org_role": "room_supervisor"},
        {"$set": {"org_role": "room_manager"}}
    )
    print(f"Updated {wl_result.modified_count} whitelist entries.")

    # 2. Update users (org_role)
    users_result = db.users.update_many(
        {"org_role": "room_supervisor"},
        {"$set": {"org_role": "room_manager"}}
    )
    print(f"Updated {users_result.modified_count} users.")

    # 3. Update rooms (members array nested dicts)
    # We use the positional $ operator with arrayFilters or just pull/push,
    # but the easiest way since arrays are small is to fetch, modify and replace.
    rooms_modified = 0
    for room in db.rooms.find({"members.room_role": "room_supervisor"}):
        new_members = []
        for m in room.get("members", []):
            if m.get("room_role") == "room_supervisor":
                m["room_role"] = "room_manager"
            new_members.append(m)
            
        db.rooms.update_one(
            {"_id": room["_id"]},
            {"$set": {"members": new_members}}
        )
        rooms_modified += 1
        
    print(f"Updated {rooms_modified} rooms.")

if __name__ == "__main__":
    migrate()
