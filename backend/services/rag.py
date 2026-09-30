"""Búsqueda simple en la base de conocimiento (carpeta knowledge/*.md).

Divide cada archivo en secciones (títulos '## ') y puntúa por coincidencia de
palabras (TF-IDF básico). Es suficiente para empezar; más adelante se puede
cambiar por embeddings + base vectorial sin tocar el resto del sistema.
"""
import math
import re
import unicodedata
from collections import Counter
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / "knowledge"

STOP = {
    "para", "como", "pero", "porque", "cuando", "donde", "desde", "hasta", "entre",
    "sobre", "esta", "este", "esto", "esos", "esas", "ellos", "ellas", "unos", "unas",
    "todo", "toda", "todos", "todas", "muy", "mas", "sin", "con", "los", "las", "del",
    "por", "una", "que", "les", "sus", "mis", "ese", "esa", "hay", "fue", "son", "ser",
    "esta", "estan", "tiene", "tienen", "tambien", "solo", "asi", "cada", "otro", "otra",
}

_chunks = None
_df: Counter = Counter()


def _norm(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def _tokens(texto: str) -> list:
    # Recorta a 4 letras como "raíz" aproximada (acoso/acosando -> acos)
    return [
        w[:4]
        for w in re.findall(r"[a-z0-9]{4,}", _norm(texto))
        if w not in STOP
    ]


def _cargar():
    global _chunks, _df
    if _chunks is not None:
        return _chunks
    chunks = []
    for archivo in sorted(DIR.glob("*.md")):
        contenido = archivo.read_text(encoding="utf-8")
        for parte in re.split(r"(?m)^## ", contenido)[1:]:
            titulo, _, cuerpo = parte.partition("\n")
            cuerpo = cuerpo.strip()
            if not cuerpo:
                continue
            tokens = _tokens(titulo + " " + cuerpo)
            chunks.append(
                {
                    "fuente": archivo.stem,
                    "titulo": titulo.strip(),
                    "texto": cuerpo,
                    "tf": Counter(tokens),
                    "largo": max(len(tokens), 1),
                }
            )
    _df = Counter()
    for c in chunks:
        _df.update(c["tf"].keys())
    _chunks = chunks
    return _chunks


def recargar():
    global _chunks
    _chunks = None
    _cargar()


def buscar(consulta: str, k: int = 4) -> list:
    chunks = _cargar()
    if not chunks:
        return []
    n = len(chunks)
    consulta_tokens = set(_tokens(consulta))
    puntuados = []
    for c in chunks:
        puntaje = sum(
            c["tf"][t] * math.log(1 + n / _df[t])
            for t in consulta_tokens
            if t in c["tf"]
        )
        if puntaje > 0:
            puntuados.append((puntaje / math.sqrt(c["largo"]), c))
    puntuados.sort(key=lambda x: x[0], reverse=True)
    return [
        {"fuente": c["fuente"], "titulo": c["titulo"], "texto": c["texto"]}
        for _, c in puntuados[:k]
    ]