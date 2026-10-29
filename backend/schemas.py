from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class DenunciaCreate(BaseModel):
    # Se quitan los espacios antes de validar: "          " no es una denuncia
    model_config = ConfigDict(str_strip_whitespace=True)

    texto: str = Field(min_length=10, max_length=5000)
    es_anonima: bool = True
    lugar: Optional[str] = Field(default=None, max_length=120)
    curso: Optional[str] = Field(default=None, max_length=60)
    denunciante_nombre: Optional[str] = Field(default=None, max_length=120)
    denunciante_contacto: Optional[str] = Field(default=None, max_length=120)


class DenunciaCreada(BaseModel):
    id: int
    codigo_seguimiento: str
    mensaje: str


class SeguimientoOut(BaseModel):
    estado: str
    creado_en: datetime


class TextoEntrada(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=190)
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nombre: str
    rol: str


class EstadoIn(BaseModel):
    estado: Literal["nuevo", "en_revision", "en_intervencion", "cerrado"]


class NotaIn(BaseModel):
    texto: str = Field(min_length=1, max_length=3000)


class DescartarAlertaIn(BaseModel):
    motivo: str = Field(min_length=10, max_length=1000)