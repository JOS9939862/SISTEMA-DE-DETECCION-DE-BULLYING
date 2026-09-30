"""Detección básica de riesgo crítico.

Es una primera capa por palabras clave: sirve como red de seguridad aunque
falle el modelo de IA. Luego se complementa con el análisis del modelo.
Siempre debe revisar un humano (orientador/psicólogo).
"""
import re
import unicodedata

PATRONES_CRITICOS = [
    r"suicid",
    r"quitarme la vida",
    r"quitarse la vida",
    r"matarme",
    r"no quiero vivir",
    r"no quiero seguir viviendo",
    r"acabar con todo",
    r"hacerme dano",
    r"cortarme",
    r"me quiero morir",
    r"tiene un arma",
    r"traer un arma",
    r"lo va a matar",
    r"me va a matar",
    r"abuso sexual",
    r"me toco",
    r"me obligo a",
    r"(quiero|quisiera|ojala|deseo) desaparecer",
    r"no aguanto mas",
    r"no quiero despertar",
    r"no quiero seguir",
    r"fotos? intimas?",
    r"fotos? desnud",
    r"tocamiento",
    r"manose",
    r"(me|nos) (toca|toco|tocaba) .{0,40}(incomod|cuerpo|partes|no (le )?cuente|secreto)",
]


def _normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def detectar_riesgo_critico(texto: str) -> bool:
    limpio = _normalizar(texto)
    return any(re.search(p, limpio) for p in PATRONES_CRITICOS)