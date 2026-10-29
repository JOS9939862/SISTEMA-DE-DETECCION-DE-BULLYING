# CLARO — Sistema de detección de bullying

Plataforma web para que estudiantes denuncien situaciones de bullying y ciberbullying,
de forma **anónima o identificada**, y para que el equipo de orientación las priorice
y les dé seguimiento con apoyo de inteligencia artificial.

> La IA es una herramienta de **apoyo**: no diagnostica, no acusa y no reemplaza la
> valoración de un profesional. Todas las decisiones las toma una persona.

## Funcionalidades

**Para estudiantes (sin cuenta)**
- Hacer una denuncia anónima o identificada (`/denunciar`).
- Recibir un código de seguimiento (`BLY-XXXX-XXXX`) y consultar el estado del caso (`/seguimiento`).

**Para el personal (orientadores, psicólogos, administradores)**
- Panel con los casos ordenados por prioridad: primero los de riesgo crítico, luego por severidad y fecha.
- Estadísticas por estado, severidad, tipo de bullying y lugar.
- Detalle de cada caso con el análisis de la IA, notas profesionales y cambio de estado.
- Descartar una alerta de riesgo crítico que resultó ser falsa, dejando registrado el motivo y quién lo hizo.

## Cómo funciona el análisis

```
Denuncia ──► 1. Detector de riesgo crítico (palabras clave, instantáneo)
         ──► 2. Análisis por reglas (instantáneo, el caso ya queda priorizado)
         ──► 3. Análisis con IA en segundo plano (RAG + LLM), reemplaza al anterior
```

1. **Detector de riesgo crítico** (`backend/services/riesgo.py`): busca señales de suicidio,
   autolesión, amenazas graves, armas y violencia sexual, en primera y tercera persona.
   Prioriza no dejar pasar casos reales: prefiere marcar de más, y el personal puede
   descartar una falsa alarma.
2. **Análisis por reglas** (`backend/services/ia_analisis.py`): clasifica el tipo de bullying
   y la severidad. Funciona aunque no haya IA configurada.
3. **IA con RAG**: se buscan los fragmentos relevantes de la base de conocimiento
   (`backend/knowledge/*.md`: tipos de bullying, señales de alerta y protocolo de actuación)
   y se envían junto con la denuncia al modelo (Llama 3.1 vía Ollama, o Claude). La respuesta
   se valida contra valores permitidos. Si el detector marcó riesgo crítico, la IA no puede rebajarlo.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Base de datos | MySQL |
| IA | Ollama (Llama 3.1) o Claude (Anthropic) |
| Seguridad | JWT, bcrypt, control de acceso por roles |

## Instalación

Requisitos: Python 3.13, Node.js 20+, pnpm, MySQL y, opcionalmente, [Ollama](https://ollama.com)
con el modelo `llama3.1`.

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  (Linux/Mac: source venv/bin/activate)
pip install -r requirements-dev.txt
copy .env.example .env         # y completa los datos de MySQL y JWT_SECRET
python crear_usuario.py        # crea el primer usuario del personal
uvicorn main:app --reload
```

Las tablas se crean solas al arrancar el servidor. La API queda en `http://localhost:8000`
y su documentación interactiva en `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Si el backend está en otra dirección, defínela en
`frontend/.env.local` con `NEXT_PUBLIC_API_URL=http://...`.

### 3. Tests

```bash
cd backend
pytest
```

Los tests usan una base SQLite en memoria, así que no necesitan MySQL ni IA.

## Privacidad y seguridad

- **Anonimato real**: en una denuncia anónima el servidor descarta nombre y contacto aunque
  el navegador los envíe.
- **Código de seguimiento**: solo se guarda su hash (SHA-256), nunca el código.
- **Contraseñas** con bcrypt y sesiones con JWT de duración limitada.
- **Roles**: solo `admin`, `orientador` y `psicologo` acceden a los casos.
- **Trazabilidad**: descartar una alerta exige un motivo y queda registrado con el autor.
- **Datos fuera del colegio**: con Ollama los textos no salen del equipo; con un proveedor
  externo (Claude, Groq…) sí se envían a ese servicio.
- El contenido de las denuncias no se escribe en los logs.

## Limitaciones conocidas y trabajo futuro

- El detector por palabras clave puede fallar con frases que no conoce; por eso siempre
  revisa una persona.
- Falta un límite de solicitudes (rate limiting) en el formulario público y en el login.
- Las migraciones de base de datos son mínimas (`backend/migraciones.py`); en producción
  convendría usar Alembic.
- Notificar por correo al equipo cuando entra un caso crítico.
- Permitir que el orientador responda al estudiante a través del código de seguimiento.

## Estructura

```
backend/
  main.py              App FastAPI y arranque
  routers/             Endpoints: denuncias (público), auth, casos (personal)
  services/            Detector de riesgo, análisis IA, búsqueda RAG
  knowledge/           Base de conocimiento para la IA
  migraciones.py       Crea tablas y columnas nuevas
  tests/               Tests automatizados (pytest)
frontend/
  app/                 Páginas: inicio, denunciar, seguimiento, login, panel
  components/panel/    Etiquetas y badges del panel
  lib/api.ts           Cliente de la API
```
