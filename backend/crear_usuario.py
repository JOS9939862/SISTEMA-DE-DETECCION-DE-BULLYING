"""Crea un usuario del personal (admin u orientador).

Uso, dentro de backend/ y con el entorno virtual activado:
    python crear_usuario.py
"""
import getpass
import sys

from database import SessionLocal, engine
from models import Base, Usuario
from security import hash_password


def main():
    Base.metadata.create_all(bind=engine)

    nombre = input("Nombre completo: ").strip()
    email = input("Correo: ").strip().lower()
    rol = input("Rol (admin/orientador) [orientador]: ").strip() or "orientador"
    if not nombre or "@" not in email:
        sys.exit("Nombre o correo inválido.")
    if rol not in ("admin", "orientador"):
        sys.exit("Rol inválido.")

    password = getpass.getpass("Contraseña (mínimo 8 caracteres): ")
    if len(password) < 8:
        sys.exit("La contraseña es demasiado corta.")
    if password != getpass.getpass("Repite la contraseña: "):
        sys.exit("Las contraseñas no coinciden.")

    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.email == email).first():
            sys.exit("Ya existe un usuario con ese correo.")
        db.add(Usuario(nombre=nombre, email=email, rol=rol, password_hash=hash_password(password)))
        db.commit()
        print(f"Usuario {email} creado con rol {rol}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()