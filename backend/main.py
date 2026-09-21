from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine

app = FastAPI(title="API Sistema Anti-Bullying")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
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