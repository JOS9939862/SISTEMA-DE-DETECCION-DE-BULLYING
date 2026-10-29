import pytest
from fastapi import HTTPException

from deps import require_roles
from models import Usuario


def crear_usuario(rol: str):
    return Usuario(
        id=1,
        nombre="Usuario de prueba",
        email="prueba@test.com",
        password_hash="hash",
        rol=rol,
        activo=True,
    )


def test_admin_tiene_acceso():
    dependencia = require_roles("admin", "orientador", "psicologo")
    usuario = crear_usuario("admin")

    resultado = dependencia(usuario)

    assert resultado == usuario


def test_orientador_tiene_acceso():
    dependencia = require_roles("admin", "orientador", "psicologo")
    usuario = crear_usuario("orientador")

    resultado = dependencia(usuario)

    assert resultado == usuario


def test_psicologo_tiene_acceso():
    dependencia = require_roles("admin", "orientador", "psicologo")
    usuario = crear_usuario("psicologo")

    resultado = dependencia(usuario)

    assert resultado == usuario


def test_rol_no_autorizado_recibe_403():
    dependencia = require_roles("admin", "orientador", "psicologo")
    usuario = crear_usuario("estudiante")

    with pytest.raises(HTTPException) as error:
        dependencia(usuario)

    assert error.value.status_code == 403