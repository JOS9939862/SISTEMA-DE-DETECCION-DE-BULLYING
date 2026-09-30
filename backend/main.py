import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine
from deps import get_db
from models import Base
from routers import auth, casos, denuncias
from schemas import TextoEntrada
from services.riesgo import detectar_riesgo_critico

load_dotenv()

# Crea las tablas que falten (para desarrollo; luego usa Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Sistema Anti-Bullying")

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
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}


@app.post("/predict")
def predict(entrada: TextoEntrada):
    return {
        "status": "ok",
        "riesgo_critico": detectar_riesgo_critico(entrada.text),
    }