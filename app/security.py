from fastapi import Header, HTTPException


def get_user_key(x_user_key: str = Header(None)) -> str:
    if not x_user_key or not isinstance(x_user_key, str):
        raise HTTPException(status_code=400, detail="Missing x-user-key header.")
    if len(x_user_key) > 200:
        raise HTTPException(status_code=400, detail="Invalid x-user-key header.")
    return x_user_key
