from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from config import JWT_EXPIRE_MIN, JWT_SECRET


def _b(password: str) -> bytes:
    # bcrypt solo usa los primeros 72 bytes
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_b(password), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_b(password), hashed.encode())
    except ValueError:
        return False


def crear_token(user_id: int, rol: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN)
    return jwt.encode(
        {"sub": str(user_id), "rol": rol, "exp": exp}, JWT_SECRET, algorithm="HS256"
    )


def decodificar_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None