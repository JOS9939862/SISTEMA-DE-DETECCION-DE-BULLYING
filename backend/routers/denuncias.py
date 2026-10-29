import hashlib
import secrets
from datetime import timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_db
from models import Denuncia
from schemas import DenunciaCreada, DenunciaCreate, SeguimientoOut
from services.ia_analisis import procesar_denuncia
from services.riesgo import detectar_riesgo_critico

router = APIRouter(prefix="/api", tags=["denuncias"])


def _hash_codigo(codigo: str) -> str:
    return hashlib.sha256(codigo.strip().upper().encode()).hexdigest()


def _generar_codigo() -> str:
    # Ej: BLY-7F3K-92QD (sin caracteres confusos como 0/O o 1/I)
    alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    parte = lambda: "".join(secrets.choice(alfabeto) for _ in range(4))
    return f"BLY-{parte()}-{parte()}"


@router.post("/denuncias", response_model=DenunciaCreada, status_code=201)
def crear_denuncia(
    datos: DenunciaCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    codigo = _generar_codigo()

    denuncia = Denuncia(
        codigo_hash=_hash_codigo(codigo),
        es_anonima=datos.es_anonima,
        # En denuncias anónimas se descarta cualquier dato de identidad,
        # aunque el cliente lo envíe.
        denunciante_nombre=None if datos.es_anonima else datos.denunciante_nombre,
        denunciante_contacto=None if datos.es_anonima else datos.denunciante_contacto,
        texto=datos.texto,
        lugar=datos.lugar,
        curso=datos.curso,
        riesgo_critico=detectar_riesgo_critico(datos.texto),
    )
    db.add(denuncia)
    db.commit()
    db.refresh(denuncia)

    # El análisis con IA corre en segundo plano: el usuario no espera.
    background_tasks.add_task(procesar_denuncia, denuncia.id)

    return DenunciaCreada(
        id=denuncia.id,
        codigo_seguimiento=codigo,
        mensaje="Denuncia recibida. Guarda tu código para consultar el estado.",
    )


@router.get("/seguimiento/{codigo}", response_model=SeguimientoOut)
def consultar_seguimiento(codigo: str, db: Session = Depends(get_db)):
    denuncia = (
        db.query(Denuncia)
        .filter(Denuncia.codigo_hash == _hash_codigo(codigo))
        .first()
    )
    if not denuncia:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    creado = denuncia.creado_en
    if creado.tzinfo is None:  # MySQL guarda la fecha sin zona: es UTC
        creado = creado.replace(tzinfo=timezone.utc)
    return SeguimientoOut(estado=denuncia.estado, creado_en=creado)