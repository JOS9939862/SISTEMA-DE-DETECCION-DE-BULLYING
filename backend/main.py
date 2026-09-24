from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine

app = FastAPI(title="API Sistema Anti-Bullying")

# Configuración de CORS corregida para permitir llamadas desde Next.js (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"  # Permite cualquier origen en desarrollo local
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"mensaje": "FastAPI: Servidor en línea"}

@app.get("/api/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"estado": "éxito", "mensaje": "MySQL: Conexión exitosa con el usuario de la app"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

# Endpoint /predict que requiere el frontend para analizar mensajes
@app.post("/predict")
def predict(data: dict):
    # Aquí puedes conectar tu modelo de IA o procesamiento de texto
    return {
        "status": "ok",
        "prediction": "Procesado correctamente",
        "data": data
    }