import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from database import DB_HOST, DB_PORT
from deps import get_db
from migraciones import preparar_bd
from routers import auth, casos, denuncias
from schemas import TextoEntrada
from services.riesgo import detectar_riesgo_critico

load_dotenv()

log = logging.getLogger("bullying")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        preparar_bd()
    except OperationalError:
        raise SystemExit(
            f"\n[ERROR] No se pudo conectar a MySQL en {DB_HOST}:{DB_PORT}.\n"
            "Revisa que el servidor MySQL esté encendido y que los datos DB_* del .env sean correctos.\n"
        ) from None
    yield


app = FastAPI(title="API Sistema Anti-Bullying", lifespan=lifespan)

# En .env: CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
origenes = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origenes],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(denuncias.router)
app.include_router(auth.router)
app.include_router(casos.router)


@app.get("/")
def read_root():
    return {"mensaje": "FastAPI: Servidor en línea"}


@app.get("/api/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"estado": "éxito", "mensaje": "MySQL: Conexión exitosa"}
    except Exception:
        # El detalle (host, usuario...) va al log del servidor, no al público
        log.exception("Falló la prueba de conexión a MySQL")
        return {"estado": "error", "mensaje": "MySQL: No se pudo conectar"}


@app.post("/predict")
def predict(entrada: TextoEntrada):
    return {
        "status": "ok",
        "riesgo_critico": detectar_riesgo_critico(entrada.text),
    }