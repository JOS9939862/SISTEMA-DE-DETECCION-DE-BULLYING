import json
from collections import Counter
from datetime import timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models import Denuncia, Nota, Usuario
from schemas import EstadoIn, NotaIn
from services.ia_analisis import procesar_denuncia

router = APIRouter(
    prefix="/api/casos", tags=["casos"], dependencies=[Depends(get_current_user)]
)

ORDEN_SEVERIDAD = {"critica": 0, "alta": 1, "media": 2, "baja": 3}


def _iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _json(valor):
    try:
        return json.loads(valor) if valor else []
    except ValueError:
        return []


def _analisis_out(a):
    if not a:
        return None
    return {
        "clasificacion": a.clasificacion,
        "tipos": _json(a.tipos),
        "severidad": a.severidad,
        "riesgo_critico": a.riesgo_critico,
        "indicadores_riesgo": _json(a.indicadores_riesgo),
        "resumen": a.resumen,
        "impacto_emocional": a.impacto_emocional,
        "recomendaciones": _json(a.recomendaciones),
        "preguntas_seguimiento": _json(a.preguntas_seguimiento),
        "fuentes": _json(a.fuentes),
        "modelo": a.modelo,
        "es_respaldo": a.es_respaldo,
        "creado_en": _iso(a.creado_en),
    }


def _resumen(d: Denuncia):
    a = d.analisis
    return {
        "id": d.id,
        "creado_en": _iso(d.creado_en),
        "estado": d.estado,
        "riesgo_critico": d.riesgo_critico,
        "es_anonima": d.es_anonima,
        "lugar": d.lugar,
        "curso": d.curso,
        "extracto": d.texto[:160] + ("…" if len(d.texto) > 160 else ""),
        "severidad": a.severidad if a else None,
        "tipos": _json(a.tipos) if a else [],
        "clasificacion": a.clasificacion if a else None,
    }


def _detalle(d: Denuncia):
    return {
        "id": d.id,
        "creado_en": _iso(d.creado_en),
        "estado": d.estado,
        "riesgo_critico": d.riesgo_critico,
        "es_anonima": d.es_anonima,
        "lugar": d.lugar,
        "curso": d.curso,
        "texto": d.texto,
        # La identidad solo existe si la persona decidió darla
        "denunciante_nombre": None if d.es_anonima else d.denunciante_nombre,
        "denunciante_contacto": None if d.es_anonima else d.denunciante_contacto,
        "analisis": _analisis_out(d.analisis),
        "notas": [
            {
                "id": n.id,
                "autor": n.autor.nombre if n.autor else "—",
                "texto": n.texto,
                "creado_en": _iso(n.creado_en),
            }
            for n in d.notas
        ],
    }


def _obtener(db: Session, caso_id: int) -> Denuncia:
    d = db.get(Denuncia, caso_id)
    if not d:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    return d


@router.get("")
def listar_casos(estado: str = None, db: Session = Depends(get_db)):
    consulta = db.query(Denuncia)
    if estado:
        consulta = consulta.filter(Denuncia.estado == estado)
    casos = consulta.limit(500).all()

    def prioridad(d: Denuncia):
        sev = d.analisis.severidad if d.analisis else None
        return (
            not d.riesgo_critico,
            ORDEN_SEVERIDAD.get(sev, 4),
            -d.creado_en.timestamp(),
        )

    casos.sort(key=prioridad)
    return [_resumen(d) for d in casos]


@router.get("/estadisticas")
def estadisticas(db: Session = Depends(get_db)):
    casos = db.query(Denuncia).all()
    por_estado = Counter(d.estado for d in casos)
    por_sev = Counter(d.analisis.severidad for d in casos if d.analisis)
    por_tipo = Counter(t for d in casos if d.analisis for t in _json(d.analisis.tipos))
    por_lugar = Counter(d.lugar.strip().lower() for d in casos if d.lugar and d.lugar.strip())
    return {
        "total": len(casos),
        "criticos_abiertos": sum(1 for d in casos if d.riesgo_critico and d.estado != "cerrado"),
        "por_estado": dict(por_estado),
        "por_severidad": dict(por_sev),
        "por_tipo": dict(por_tipo),
        "por_lugar": dict(por_lugar.most_common(5)),
    }


@router.get("/{caso_id}")
def detalle_caso(caso_id: int, db: Session = Depends(get_db)):
    return _detalle(_obtener(db, caso_id))


@router.patch("/{caso_id}/estado")
def cambiar_estado(caso_id: int, datos: EstadoIn, db: Session = Depends(get_db)):
    d = _obtener(db, caso_id)
    d.estado = datos.estado
    db.commit()
    db.refresh(d)
    return _detalle(d)


@router.post("/{caso_id}/notas", status_code=201)
def agregar_nota(
    caso_id: int,
    datos: NotaIn,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    d = _obtener(db, caso_id)
    db.add(Nota(denuncia_id=d.id, autor_id=user.id, texto=datos.texto.strip()))
    db.commit()
    db.refresh(d)
    return _detalle(d)


@router.post("/{caso_id}/analizar")
def reanalizar(caso_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Lanza el re-análisis en segundo plano y responde al instante
    (con un modelo local puede tardar minutos)."""
    d = _obtener(db, caso_id)
    background_tasks.add_task(procesar_denuncia, d.id)
    return _detalle(d)