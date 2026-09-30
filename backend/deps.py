from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Usuario
from security import decodificar_token

bearer = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if not cred:
        raise HTTPException(status_code=401, detail="No autenticado")
    data = decodificar_token(cred.credentials)
    if not data:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    user = db.get(Usuario, int(data["sub"]))
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    return user