"""Fixtures compartidas: base SQLite en memoria en lugar de MySQL."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import deps
from main import app
from migraciones import preparar_bd
from models import Usuario


@pytest.fixture
def SesionPrueba(monkeypatch):
    motor = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    preparar_bd(motor)
    Sesion = sessionmaker(bind=motor, autoflush=False)
    # El análisis en segundo plano abre su propia sesión
    monkeypatch.setattr("services.ia_analisis.SessionLocal", Sesion)
    # Sin IA en los tests: se usa siempre el análisis por reglas
    monkeypatch.setattr("config.ia_configurada", lambda: False)
    return Sesion


@pytest.fixture
def db(SesionPrueba):
    sesion = SesionPrueba()
    yield sesion
    sesion.close()


@pytest.fixture
def usuario(db):
    u = Usuario(
        nombre="Orientadora de prueba",
        email="orientadora@test.com",
        password_hash="x",
        rol="orientador",
    )
    db.add(u)
    db.commit()
    return u


@pytest.fixture
def cliente(SesionPrueba, usuario):
    def get_db_prueba():
        sesion = SesionPrueba()
        try:
            yield sesion
        finally:
            sesion.close()

    app.dependency_overrides[deps.get_db] = get_db_prueba
    app.dependency_overrides[deps.get_current_user] = lambda: usuario
    yield TestClient(app)
    app.dependency_overrides.clear()
