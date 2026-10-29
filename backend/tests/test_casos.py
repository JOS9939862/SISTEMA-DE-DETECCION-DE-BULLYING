from datetime import datetime, timedelta

from models import Denuncia, Nota
from routers.casos import LIMITE_CASOS

TEXTO_NORMAL = "Un compañero se burla de mí todos los días en el recreo."
TEXTO_CRITICO = "Mi mamá me va a matar si ve mi nota de matemáticas."


def crear(cliente, texto=TEXTO_NORMAL, **extra):
    respuesta = cliente.post("/api/denuncias", json={"texto": texto, **extra})
    assert respuesta.status_code == 201
    return respuesta.json()


def test_denuncia_anonima_descarta_identidad(cliente, db):
    creada = crear(
        cliente,
        es_anonima=True,
        denunciante_nombre="Ana Pérez",
        denunciante_contacto="ana@correo.com",
    )

    d = db.get(Denuncia, creada["id"])
    assert d.denunciante_nombre is None
    assert d.denunciante_contacto is None


def test_denuncia_solo_con_espacios_es_rechazada(cliente):
    respuesta = cliente.post("/api/denuncias", json={"texto": " " * 20})

    assert respuesta.status_code == 422


def test_codigo_de_seguimiento_funciona(cliente):
    codigo = crear(cliente)["codigo_seguimiento"]

    respuesta = cliente.get(f"/api/seguimiento/{codigo.lower()}")

    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "nuevo"
    assert cliente.get("/api/seguimiento/BLY-XXXX-XXXX").status_code == 404


def test_denuncia_recibe_analisis_por_reglas(cliente):
    caso = cliente.get(f"/api/casos/{crear(cliente)['id']}").json()

    assert caso["analisis"]["es_respaldo"] is True
    assert "verbal" in caso["analisis"]["tipos"]


def test_listado_ordena_por_prioridad_antes_del_limite(cliente, db):
    # Un caso crítico antiguo y más casos normales recientes que el límite:
    # el crítico debe aparecer primero aunque sea el más viejo.
    base = datetime(2026, 1, 1)
    db.add(Denuncia(codigo_hash="critico", texto="x", riesgo_critico=True, creado_en=base))
    db.add_all(
        Denuncia(codigo_hash=f"n{i}", texto="x", creado_en=base + timedelta(hours=i + 1))
        for i in range(LIMITE_CASOS + 5)
    )
    db.commit()

    casos = cliente.get("/api/casos").json()

    assert len(casos) == LIMITE_CASOS
    assert casos[0]["riesgo_critico"] is True
    # Entre los normales, primero el más reciente
    assert casos[1]["creado_en"] > casos[2]["creado_en"]


def test_descartar_alerta_falsa(cliente, db, usuario):
    caso_id = crear(cliente, TEXTO_CRITICO)["id"]
    caso = cliente.get(f"/api/casos/{caso_id}").json()
    assert caso["riesgo_critico"] is True
    assert caso["analisis"]["severidad"] == "critica"

    # El motivo es obligatorio
    corto = cliente.post(f"/api/casos/{caso_id}/descartar-alerta", json={"motivo": "no"})
    assert corto.status_code == 422

    respuesta = cliente.post(
        f"/api/casos/{caso_id}/descartar-alerta",
        json={"motivo": "Es una expresión coloquial, no una amenaza real."},
    )
    assert respuesta.status_code == 200
    assert respuesta.json()["riesgo_critico"] is False
    assert respuesta.json()["alerta_descartada"] is True

    # Queda registrado quién lo descartó y por qué
    nota = db.query(Nota).filter(Nota.denuncia_id == caso_id).one()
    assert nota.autor_id == usuario.id
    assert "expresión coloquial" in nota.texto

    # El análisis se recalcula sin forzar "critica", y no se reactiva al reanalizar
    cliente.post(f"/api/casos/{caso_id}/analizar")
    caso = cliente.get(f"/api/casos/{caso_id}").json()
    assert caso["riesgo_critico"] is False
    assert caso["analisis"]["severidad"] != "critica"


def test_no_se_descarta_un_caso_sin_alerta(cliente):
    caso_id = crear(cliente)["id"]

    respuesta = cliente.post(
        f"/api/casos/{caso_id}/descartar-alerta",
        json={"motivo": "Motivo suficientemente largo."},
    )

    assert respuesta.status_code == 409
