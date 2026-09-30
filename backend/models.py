from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

# Si tu database.py ya define Base, borra esta línea y usa:
# from database import Base
Base = declarative_base()


def _ahora():
    return datetime.now(timezone.utc)


class Usuario(Base):
    """Personal autorizado: orientadores, psicólogos, administradores."""

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="orientador", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=_ahora, nullable=False)


class Denuncia(Base):
    __tablename__ = "denuncias"

    id = Column(Integer, primary_key=True, index=True)

    # Solo se guarda el hash del código de seguimiento.
    codigo_hash = Column(String(64), unique=True, index=True, nullable=False)

    es_anonima = Column(Boolean, default=True, nullable=False)
    denunciante_nombre = Column(String(120), nullable=True)
    denunciante_contacto = Column(String(120), nullable=True)

    texto = Column(Text, nullable=False)
    lugar = Column(String(120), nullable=True)
    curso = Column(String(60), nullable=True)

    riesgo_critico = Column(Boolean, default=False, nullable=False)
    estado = Column(String(20), default="nuevo", nullable=False)
    creado_en = Column(DateTime, default=_ahora, nullable=False)

    analisis = relationship(
        "AnalisisIA", uselist=False, back_populates="denuncia", cascade="all, delete-orphan"
    )
    notas = relationship(
        "Nota",
        back_populates="denuncia",
        cascade="all, delete-orphan",
        order_by="Nota.creado_en",
    )


class AnalisisIA(Base):
    __tablename__ = "analisis_ia"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(
        Integer, ForeignKey("denuncias.id"), unique=True, index=True, nullable=False
    )
    clasificacion = Column(String(30), nullable=False)
    tipos = Column(Text, nullable=False, default="[]")  # JSON
    severidad = Column(String(20), nullable=False)
    riesgo_critico = Column(Boolean, default=False, nullable=False)
    indicadores_riesgo = Column(Text, nullable=False, default="[]")  # JSON
    resumen = Column(Text, nullable=False)
    impacto_emocional = Column(Text, nullable=False)
    recomendaciones = Column(Text, nullable=False, default="[]")  # JSON
    preguntas_seguimiento = Column(Text, nullable=False, default="[]")  # JSON
    fuentes = Column(Text, nullable=False, default="[]")  # JSON
    modelo = Column(String(60), nullable=True)
    es_respaldo = Column(Boolean, default=False, nullable=False)
    creado_en = Column(DateTime, default=_ahora, nullable=False)

    denuncia = relationship("Denuncia", back_populates="analisis")


class Nota(Base):
    __tablename__ = "notas_caso"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(Integer, ForeignKey("denuncias.id"), index=True, nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    texto = Column(Text, nullable=False)
    creado_en = Column(DateTime, default=_ahora, nullable=False)

    denuncia = relationship("Denuncia", back_populates="notas")
    autor = relationship("Usuario")