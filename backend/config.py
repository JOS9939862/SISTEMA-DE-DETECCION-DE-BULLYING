import os
import secrets

from dotenv import load_dotenv

load_dotenv()

# Proveedor de IA: "anthropic" (Claude) u "openai" (cualquier servicio compatible
# con la API de OpenAI: Groq, OpenRouter, Ollama local, Gemini, etc.)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic").strip().lower()

# Claude (Anthropic)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")

# Proveedores compatibles con OpenAI (Groq, OpenRouter, Ollama...)
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")


# Ajustes de velocidad (importantes con modelos locales lentos)
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "900"))  # tope de texto que genera el modelo
RAG_K = int(os.getenv("RAG_K", "3"))  # fragmentos de la base de conocimiento que se envían
RAG_MAX_CHARS = int(os.getenv("RAG_MAX_CHARS", "600"))  # largo máximo de cada fragmento


def ia_configurada() -> bool:
    """True si hay lo necesario para llamar a un modelo de IA."""
    if LLM_PROVIDER == "anthropic":
        return bool(ANTHROPIC_API_KEY)
    # Ollama local no necesita clave, pero sí dirección y modelo
    return bool(LLM_BASE_URL and LLM_MODEL)


def nombre_modelo() -> str:
    return ANTHROPIC_MODEL if LLM_PROVIDER == "anthropic" else LLM_MODEL

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(32)
    print(
        "[AVISO] JWT_SECRET no está definido en .env: se usa una clave temporal "
        "(las sesiones se cierran al reiniciar el servidor)."
    )
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "480"))