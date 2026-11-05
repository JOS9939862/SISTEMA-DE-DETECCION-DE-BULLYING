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

### 1. Base de datos

Las tablas se crean solas, pero la base de datos hay que crearla una vez en MySQL. Su nombre
debe coincidir con `DB_NAME` en el `.env`:

```sql
CREATE DATABASE bullying_db CHARACTER SET utf8mb4;
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  (Linux/Mac: source venv/bin/activate)
pip install -r requirements-dev.txt
copy .env.example .env         # y completa los datos de MySQL y JWT_SECRET
python crear_usuario.py        # crea el primer usuario del personal
uvicorn main:app --reload
```

La API queda en `http://localhost:8000` y su documentación interactiva en
`http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Si el backend está en otra dirección, defínela en
`frontend/.env.local` con `NEXT_PUBLIC_API_URL=http://...`.

### 4. Inteligencia artificial (opcional)

Sin IA configurada, el sistema sigue funcionando con el análisis por reglas. Para activarla,
elige una opción en `backend/.env`:

| Opción | Preparación | Variables |
|---|---|---|
| Ollama (local) | `ollama pull llama3.1` | `LLM_PROVIDER=openai`, `LLM_BASE_URL=http://localhost:11434/v1`, `LLM_MODEL=llama3.1` |
| Claude | Clave de API de Anthropic | `LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=...` |

Las demás variables y ajustes de velocidad están explicados en `backend/.env.example`.

### 5. Tests

```bash
cd backend
pytest
```

Los tests usan una base SQLite en memoria, así que no necesitan MySQL ni IA.

## Cuentas del personal

No hay registro público: las cuentas se administran desde la terminal, dentro de `backend/` y
con el entorno virtual activado.

```bash
python crear_usuario.py                            # crea un usuario (admin, orientador o psicologo)
python cambiar_password.py correo@ejemplo.com      # pide una contraseña nueva
python cambiar_password.py correo@ejemplo.com --generar   # genera una temporal
```

Las contraseñas se guardan cifradas y no se pueden recuperar, solo reemplazar.

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/denuncias` | Público | Crea una denuncia y devuelve el código de seguimiento |
| GET | `/api/seguimiento/{codigo}` | Público | Consulta el estado de un caso |
| POST | `/api/auth/login` | Público | Inicia sesión |
| GET | `/api/auth/me` | Sesión iniciada | Datos del usuario actual |
| GET | `/api/casos` | Personal | Lista de casos por prioridad |
| GET | `/api/casos/estadisticas` | Personal | Estadísticas del panel |
| GET | `/api/casos/{id}` | Personal | Detalle de un caso |
| PATCH | `/api/casos/{id}/estado` | Personal | Cambia el estado |
| POST | `/api/casos/{id}/notas` | Personal | Agrega una nota profesional |
| POST | `/api/casos/{id}/analizar` | Personal | Repite el análisis |
| POST | `/api/casos/{id}/descartar-alerta` | Personal | Descarta una alerta de riesgo crítico |

Los estados de un caso son `nuevo`, `en_revision`, `en_intervencion` y `cerrado`.

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
  crear_usuario.py     Crea un usuario del personal
  cambiar_password.py  Cambia la contraseña de un usuario
  tests/               Tests automatizados (pytest)
frontend/
  app/                 Páginas: inicio, denunciar, seguimiento, login, panel
  components/panel/    Etiquetas y badges del panel
  lib/api.ts           Cliente de la API
```
