from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models import Usuario
from schemas import LoginIn, TokenOut
from security import crear_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == datos.email.strip().lower()).first()
    if not user or not user.activo or not verify_password(datos.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    return TokenOut(
        access_token=crear_token(user.id, user.rol), nombre=user.nombre, rol=user.rol
    )


@router.get("/me")
def me(user: Usuario = Depends(get_current_user)):
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}