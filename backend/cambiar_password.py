"""Cambia la contraseña de un usuario del personal (por ejemplo, si la olvidó).

Las contraseñas se guardan cifradas con bcrypt y no se pueden recuperar,
solo reemplazar. Uso, dentro de backend/ y con el entorno virtual activado:
    python cambiar_password.py correo@ejemplo.com             # pide la nueva contraseña
    python cambiar_password.py correo@ejemplo.com --generar   # genera una temporal
"""
import getpass
import secrets
import sys

from database import SessionLocal
from models import Usuario
from security import hash_password


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    email = sys.argv[1].strip().lower()

    if "--generar" in sys.argv[2:]:
        password = secrets.token_urlsafe(9)
    else:
        password = getpass.getpass("Nueva contraseña (mínimo 8 caracteres): ")
        if len(password) < 8:
            sys.exit("La contraseña es demasiado corta.")
        if password != getpass.getpass("Repite la contraseña: "):
            sys.exit("Las contraseñas no coinciden.")

    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if not user:
            sys.exit("No existe un usuario con ese correo.")
        user.password_hash = hash_password(password)
        db.commit()
        print(f"Contraseña de {email} actualizada.")
        if "--generar" in sys.argv[2:]:
            print(f"Contraseña temporal: {password}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
