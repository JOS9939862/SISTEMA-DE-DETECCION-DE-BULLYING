"""Análisis de denuncias con IA (Claude) apoyado en la base de conocimiento.

- El resultado es una AYUDA para el orientador: no diagnostica ni acusa.
- Si no hay API key o la llamada falla, se usa un análisis de respaldo por
  reglas, para que el sistema nunca deje una denuncia sin priorizar.
- El riesgo crítico detectado por palabras clave nunca se puede rebajar.
"""
import json
import logging
import re
import unicodedata
from datetime import datetime, timezone

import config
from database import SessionLocal
from models import AnalisisIA, Denuncia
from services.rag import buscar
from services.riesgo import detectar_riesgo_critico

log = logging.getLogger("bullying.ia")

CLASIFICACIONES = {
    "bullying", "posible_bullying", "conflicto_puntual", "otra_violencia", "no_determinado",
}
TIPOS = {"fisico", "verbal", "psicologico", "exclusion_social", "ciberbullying", "sexual", "otro"}
SEVERIDADES = {"baja", "media", "alta", "critica"}

SYSTEM = """
Eres un asistente de apoyo para la orientación y seguimiento de casos de bullying y ciberbullying.

Analiza la denuncia utilizando únicamente la información proporcionada y el contexto recuperado.

IMPORTANTE:
- No realices diagnósticos psicológicos.
- No determines culpabilidad.
- No acuses a ninguna persona.
- Tu análisis es orientativo y debe ser revisado por un profesional.
- Si existen señales críticas, la severidad DEBE ser "critica".
- Usa exclusivamente los valores permitidos.
- No inventes información que no aparezca en la denuncia o en el contexto.
- Si la información no es suficiente, utiliza "no_determinado".

clasificacion DEBE ser exactamente uno de:
- "bullying"
- "posible_bullying"
- "conflicto_puntual"
- "otra_violencia"
- "no_determinado"

tipos DEBE ser una lista que contenga uno o varios de estos valores:
- "fisico"
- "verbal"
- "psicologico"
- "exclusion_social"
- "ciberbullying"
- "sexual"
- "otro"

severidad DEBE ser exactamente uno de:
- "baja"
- "media"
- "alta"
- "critica"

CRITERIOS ORIENTATIVOS DE SEVERIDAD:
- "baja": situación aislada o de bajo impacto aparente, sin señales de riesgo grave.
- "media": existen conductas de acoso, humillación, exclusión o agresión que requieren seguimiento.
- "alta": existen agresiones físicas, amenazas, acoso persistente, contenido sexual, exposición pública grave u otras situaciones que requieren intervención prioritaria.
- "critica": existen señales de peligro inmediato, autolesión, intento o intención suicida, amenazas graves, armas, abuso sexual u otra situación que pueda representar peligro grave para la integridad de una persona.

La severidad "critica" tiene prioridad sobre cualquier otra clasificación cuando existan señales críticas.

La respuesta DEBE contener exactamente estos campos:
{
  "clasificacion": "...",
  "tipos": ["..."],
  "severidad": "...",
  "riesgo_critico": false,
  "indicadores_riesgo": [],
  "resumen": "...",
  "impacto_emocional": "...",
  "recomendaciones": [],
  "preguntas_seguimiento": []
}

REGLAS PARA LOS CAMPOS:
- "tipos" debe ser siempre una lista.
- "riesgo_critico" debe ser true únicamente cuando existan señales críticas en la denuncia.
- "indicadores_riesgo" debe ser una lista. Si no existen señales críticas, debe ser [].
- "resumen" debe explicar brevemente los hechos descritos en la denuncia sin acusar ni determinar culpabilidad.
- "impacto_emocional" debe describir únicamente señales emocionales observables o mencionadas en el texto. No debe contener diagnósticos psicológicos.
- "recomendaciones" debe ser una lista de acciones orientativas para el profesional.
- "preguntas_seguimiento" debe ser una lista de preguntas útiles para profundizar la evaluación.
- No uses los campos "tipo" ni "detalles". Usa exactamente "tipos" y "resumen".

Responde únicamente con un objeto JSON válido, sin Markdown y sin explicaciones adicionales.
"""

def _norm(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def _lista(valor, maxn: int = 8, maxlen: int = 500) -> list:
    if not isinstance(valor, list):
        return []
    return [str(x).strip()[:maxlen] for x in valor if str(x).strip()][:maxn]


def _extraer_json(texto: str) -> dict:
    inicio, fin = texto.find("{"), texto.rfind("}")
    if inicio == -1 or fin == -1:
        raise ValueError("La respuesta del modelo no contiene JSON")
    return json.loads(texto[inicio : fin + 1])


def _normalizar(raw: dict, riesgo_kw: bool) -> dict:
    clasificacion = raw.get("clasificacion")

    if clasificacion not in CLASIFICACIONES:
        clasificacion = "no_determinado"

    severidad = raw.get("severidad")

    if severidad not in SEVERIDADES:
        severidad = "media"

    riesgo = bool(raw.get("riesgo_critico")) or riesgo_kw

    if riesgo:
        severidad = "critica"

    # El modelo puede devolver "tipo" o "tipos"
    tipos_raw = raw.get("tipos")

    if tipos_raw is None:
        tipo = raw.get("tipo")
        tipos_raw = [tipo] if tipo else []

    tipos = [
        t for t in _lista(tipos_raw)
        if t in TIPOS
    ]

    # El modelo puede devolver "resumen" o "detalles"
    resumen = str(
        raw.get("resumen")
        or raw.get("detalles")
        or ""
    ).strip()[:1500]

    if not resumen:
        resumen = "Sin resumen disponible."

    impacto = str(
        raw.get("impacto_emocional")
        or ""
    ).strip()[:1500]

    if not impacto:
        impacto = "Sin información suficiente."

    return {
        "clasificacion": clasificacion,
        "tipos": tipos,
        "severidad": severidad,
        "riesgo_critico": riesgo,
        "indicadores_riesgo": _lista(
            raw.get("indicadores_riesgo")
        ),
        "resumen": resumen,
        "impacto_emocional": impacto,
        "recomendaciones": _lista(
            raw.get("recomendaciones")
        ),
        "preguntas_seguimiento": _lista(
            raw.get("preguntas_seguimiento")
        ),
    }


# --------------------------- análisis de respaldo ---------------------------
_REGLAS_TIPO = {
    "fisico": r"golpe|pegar|pegan|pego |empuj|patada|patead|punet|lastim|agred",
    "verbal": r"insult|apod|burl|se rien|se rie|humill|ofend|grit",
    "psicologico": r"amenaz|chantaj|rumor|manipul|asust|miedo",
    "exclusion_social": r"excluy|aisl|ignor|nadie me habla|no me dejan|sin amigos|me dejan solo",
    "ciberbullying": r"whatsapp|instagram|tiktok|facebook|redes|grupo de|foto|video|internet|discord",
    "sexual": r"sexual|desnud|manose|tocamiento",
}


def _respaldo(texto: str, riesgo_kw: bool, fragmentos: list, preliminar: bool = False) -> dict:
    limpio = _norm(texto)
    tipos = [t for t, patron in _REGLAS_TIPO.items() if re.search(patron, limpio)]
    amenaza = bool(re.search(r"amenaz|matar|arma", limpio))

    if riesgo_kw:
        severidad = "critica"
    elif "sexual" in tipos or "fisico" in tipos or amenaza:
        severidad = "alta"
    elif tipos:
        severidad = "media"
    else:
        severidad = "baja"

    if "sexual" in tipos:
        clasificacion = "otra_violencia"
    elif tipos:
        clasificacion = "posible_bullying"
    else:
        clasificacion = "no_determinado"

    recomendaciones = []
    if riesgo_kw:
        recomendaciones.append(
            "PRIORIDAD INMEDIATA: contactar hoy a la persona afectada y a su familia; "
            "no dejarla sola y derivar a atención psicológica o de salud mental."
        )
    recomendaciones += [
        "Realizar entrevista individual, en privado y con lenguaje no acusatorio.",
        "Registrar hechos objetivos: qué pasó, cuándo, dónde, quiénes y con qué frecuencia.",
        "Conservar evidencia si existe (capturas, mensajes, testigos).",
    ]
    return {
        "clasificacion": clasificacion,
        "tipos": tipos,
        "severidad": severidad,
        "riesgo_critico": riesgo_kw,
        "indicadores_riesgo": ["Se detectaron expresiones de riesgo grave en el texto."]
        if riesgo_kw
        else [],
        "resumen": (
            "Análisis preliminar por reglas: el análisis con IA está en proceso y lo "
            "reemplazará cuando termine. Requiere revisión humana del texto original."
            if preliminar
            else "Análisis automático básico (la IA no estuvo disponible). "
            "Requiere revisión humana del texto original."
        ),
        "impacto_emocional": "No evaluado automáticamente. Se recomienda entrevista con el equipo psicológico.",
        "recomendaciones": recomendaciones,
        "preguntas_seguimiento": [
            "¿Desde cuándo ocurre y con qué frecuencia?",
            "¿Quiénes participan y quiénes lo presencian?",
            "¿Existe alguna evidencia o testigo?",
            "¿Cómo se está sintiendo la persona afectada?",
        ],
        "fuentes": [f"{f['fuente']} — {f['titulo']}" for f in fragmentos],
        "modelo": None,
        "es_respaldo": True,
    }


# ------------------------------ análisis con IA ------------------------------
def _llamar_modelo(prompt: str) -> str:
    if config.LLM_PROVIDER == "anthropic":
        from anthropic import Anthropic

        cliente = Anthropic(
            api_key=config.ANTHROPIC_API_KEY,
            timeout=120.0,
            max_retries=0,
        )

        resp = cliente.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=config.LLM_MAX_TOKENS,
            system=SYSTEM,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        return "".join(
            bloque.text
            for bloque in resp.content
            if bloque.type == "text"
        )

    from openai import OpenAI

    cliente = OpenAI(
        api_key=config.LLM_API_KEY or "ollama",
        base_url=config.LLM_BASE_URL,
        timeout=180.0,
        max_retries=0,
    )

    resp = cliente.chat.completions.create(
        model=config.LLM_MODEL,
        max_tokens=config.LLM_MAX_TOKENS,
        temperature=0.1,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
    )

    return resp.choices[0].message.content or ""


def analizar_denuncia(texto: str, lugar=None, curso=None, riesgo_kw: bool = False) -> dict:
    fragmentos = buscar(texto, k=config.RAG_K)
    if not config.ia_configurada():
        return _respaldo(texto, riesgo_kw, fragmentos)

    contexto = "\n\n".join(
        f"[Fuente: {f['fuente']} — {f['titulo']}]\n{f['texto'][:config.RAG_MAX_CHARS]}" for f in fragmentos
    ) or "(sin contexto disponible)"
    seguro = texto.replace("<", "(").replace(">", ")")
    prompt = (
        f"<contexto>\n{contexto}\n</contexto>\n\n"
        f'<denuncia lugar="{lugar or "no indicado"}" curso="{curso or "no indicado"}">\n'
        f"{seguro}\n</denuncia>"
    )
    try:
        respuesta_modelo = _llamar_modelo(prompt)

        print("\n======RESPUESTA DE LLAMA======")
        print(respuesta_modelo)
        print("======FIN DE RESPUESTA DE LLAMA======\n")

        raw = _extraer_json(respuesta_modelo)

        resultado = _normalizar(raw, riesgo_kw)
        
        resultado["fuentes"] = _lista(
            raw.get("fuentes_usadas")
            ) or [
            f"{f['fuente']} — {f['titulo']}" 
            for f in fragmentos
        ]

        resultado["modelo"] = config.nombre_modelo()
        resultado["es_respaldo"] = False

        return resultado
    
    except Exception:
        log.exception(
            "Falló el análisis con IA; se usa el análisis de respaldo"
        )

        return _respaldo(
            texto,
            riesgo_kw,
            fragmentos
        )


def analisis_basico(texto: str, riesgo_kw: bool, preliminar: bool = False) -> dict:
    """Análisis instantáneo por reglas (no usa IA)."""
    return _respaldo(texto, riesgo_kw, buscar(texto, k=config.RAG_K), preliminar)


def _guardar(db, d: Denuncia, r: dict) -> None:
    a = d.analisis or AnalisisIA(denuncia_id=d.id)
    a.clasificacion = r["clasificacion"]
    a.tipos = json.dumps(r["tipos"], ensure_ascii=False)
    a.severidad = r["severidad"]
    a.riesgo_critico = r["riesgo_critico"]
    a.indicadores_riesgo = json.dumps(r["indicadores_riesgo"], ensure_ascii=False)
    a.resumen = r["resumen"]
    a.impacto_emocional = r["impacto_emocional"]
    a.recomendaciones = json.dumps(r["recomendaciones"], ensure_ascii=False)
    a.preguntas_seguimiento = json.dumps(r["preguntas_seguimiento"], ensure_ascii=False)
    a.fuentes = json.dumps(r["fuentes"], ensure_ascii=False)
    a.modelo = r["modelo"]
    a.es_respaldo = r["es_respaldo"]
    a.creado_en = datetime.now(timezone.utc)
    db.add(a)
    if r["riesgo_critico"]:
        d.riesgo_critico = True
        log.warning("ALERTA: denuncia %s con RIESGO CRÍTICO. Requiere atención inmediata.", d.id)
    db.commit()


def procesar_denuncia(denuncia_id: int) -> None:
    """Analiza una denuncia en segundo plano.

    1) Si aún no hay análisis, guarda al instante uno preliminar por reglas, para que
       el caso ya aparezca priorizado en el panel aunque la IA sea lenta.
    2) Luego consulta a la IA y, si responde bien, reemplaza el análisis. Si falla,
       se conserva el que ya existe (nunca se pisa un buen análisis con uno básico).
    """
    db = SessionLocal()
    try:
        d = db.get(Denuncia, denuncia_id)
        if not d:
            return
        riesgo_kw = detectar_riesgo_critico(d.texto)
        ia_lista = config.ia_configurada()

        if d.analisis is None:
            _guardar(db, d, analisis_basico(d.texto, riesgo_kw, preliminar=ia_lista))

        if ia_lista:
            r = analizar_denuncia(d.texto, d.lugar, d.curso, riesgo_kw)
            if not r["es_respaldo"]:
                _guardar(db, d, r)
    except Exception:
        db.rollback()
        log.exception("No se pudo procesar la denuncia %s", denuncia_id)
    finally:
        db.close()