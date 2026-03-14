from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.db.mongo import users_col
from app.utils.id_utils import str_to_oid

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise exc

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise exc

    user_id = payload.get("sub")
    if not user_id:
        raise exc

    try:
        oid = str_to_oid(user_id)
    except ValueError:
        raise exc

    user = await users_col().find_one({"_id": oid})
    if not user:
        raise exc

    user["id"] = str(user.pop("_id"))
    return user


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("org_role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_org_role(*roles: str):
    async def checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("org_role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker
