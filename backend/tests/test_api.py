from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_endpoint_principal():
    respuesta = client.get("/")

    assert respuesta.status_code == 200
    assert respuesta.json()["mensaje"] == "FastAPI: Servidor en línea"


def test_predict_texto_normal():
    respuesta = client.post(
        "/predict",
        json={"text": "Un estudiante tuvo una discusión con otro compañero."},
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["status"] == "ok"
    assert respuesta.json()["riesgo_critico"] is False


def test_predict_riesgo_critico():
    respuesta = client.post(
        "/predict",
        json={"text": "Me amenazó con matarme si cuento lo que pasó."},
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["status"] == "ok"
    assert respuesta.json()["riesgo_critico"] is True