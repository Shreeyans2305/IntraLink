import time

from fastapi import APIRouter, HTTPException

from app.core.security import create_access_token, hash_password
from app.db.mongo import audit_col, whitelists_col, org_col, users_col
from app.schemas.schemas import OrgSetup
from app.utils.id_utils import doc_to_dict

router = APIRouter(prefix="/org", tags=["org"])


@router.get("/")
async def get_org_status():
    """Return all organizations and their names."""
    cursor = org_col().find({})
    orgs = []
    async for org in cursor:
        orgs.append({"id": str(org["_id"]), "name": org.get("name", "")})
    return {"orgs": orgs}


@router.post("/setup", status_code=201)
async def setup_org(body: OrgSetup):
    """Create a new organization and its first admin account. Multiple orgs allowed."""
    now = int(time.time() * 1000)

    # Check for duplicate org name
    existing = await org_col().find_one({"name": body.org_name})
    if existing:
        raise HTTPException(status_code=409, detail="Organization name already exists")

    existing_user = await users_col().find_one({"email": body.admin_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the organization
    org_doc = {
        "name": body.org_name,
        "created_at": now,
    }
    org_result = await org_col().insert_one(org_doc)
    org_id = str(org_result.inserted_id)

    # Create the admin user (scoped to org)
    user_doc = {
        "name": body.admin_name,
        "email": body.admin_email,
        "hashed_password": hash_password(body.admin_password),
        "org_role": "admin",
        "org_id": org_id,
        "status": "Active",
        "custom_status": "",
        "created_at": now,
    }
    user_result = await users_col().insert_one(user_doc)
    user_id = str(user_result.inserted_id)
    user_doc["_id"] = user_result.inserted_id

    await audit_col().insert_one({
        "user_id": user_id,
        "user": body.admin_email,
        "action": "org_setup",
        "detail": f"Organization '{body.org_name}' created by {body.admin_email}",
        "timestamp": now,
        "anomaly": False,
    })

    token = create_access_token({"sub": user_id, "org": org_id})
    safe_user = doc_to_dict(user_doc)
    safe_user.pop("hashed_password", None)

    if body.whitelists:
        whitelist_docs = []
        for wl in body.whitelists:
            whitelist_docs.append({
                "email": wl.email,
                "org_role": wl.org_role,
                "org_id": org_id,
                "added_by": user_id,
                "created_at": now
            })
        if whitelist_docs:
            await whitelists_col().insert_many(whitelist_docs)

    return {"token": token, "user": safe_user, "org": {"id": org_id, "name": body.org_name}}
