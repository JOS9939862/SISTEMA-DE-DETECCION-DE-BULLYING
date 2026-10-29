"""Prepara la base de datos al arrancar el servidor.

Crea las tablas que falten y agrega a las tablas ya existentes las columnas
nuevas de los modelos (create_all no modifica tablas existentes). Es un
reemplazo mínimo de Alembic: solo agrega, nunca borra ni modifica columnas.
"""
from sqlalchemy import inspect, text

from database import engine
from models import Base

# Columnas agregadas después de la primera versión: {tabla: {columna: definición SQL}}
COLUMNAS_NUEVAS = {
    "denuncias": {
        "alerta_descartada": "BOOLEAN NOT NULL DEFAULT 0",
    },
}


def preparar_bd(motor=engine) -> None:
    Base.metadata.create_all(bind=motor)
    inspector = inspect(motor)
    with motor.begin() as con:
        for tabla, columnas in COLUMNAS_NUEVAS.items():
            existentes = {c["name"] for c in inspector.get_columns(tabla)}
            for nombre, definicion in columnas.items():
                if nombre not in existentes:
                    con.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {nombre} {definicion}"))
