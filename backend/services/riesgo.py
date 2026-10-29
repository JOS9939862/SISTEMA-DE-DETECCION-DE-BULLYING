"""Detección básica de riesgo crítico.

Es una primera capa por palabras clave: sirve como red de seguridad aunque
falle el modelo de IA. Luego se complementa con el análisis del modelo.
Siempre debe revisar un humano (orientador/psicólogo).

Criterio: ante la duda, marcar. Un falso positivo lo descarta el orientador
desde el panel (queda registrado); un falso negativo puede dejar sin atención
a alguien en peligro. Los patrones cubren primera y tercera persona, porque
muchas denuncias las hacen testigos ("mi amiga se corta").
"""
import re
import unicodedata

# Excepciones para "cortarse": cortarse el pelo, las uñas, etc.
_NO_AUTOLESION = r"(?! (el|mi|su|las|mis|sus) (pelo|cabello|flequillo|unas))"

PATRONES_CRITICOS = [
    # Suicidio y autolesión
    r"suicid",
    r"autolesi",
    r"(quitar(me|se|le)|acabar con|terminar con) (la|mi|su) vida",
    r"\b(me|se) (quiero|quiere|queria|voy|va|iba|piensa|pienso|intento|intente) (a )?matar\b",
    r"no (quiero|quiere|queria) (vivir|seguir viviendo|despertar)",
    r"\b(me|se) (quiero|quiere|queria) morir",
    r"(quiero|quiere|quisiera|preferiria|prefiere|mejor) (estar )?muert",
    r"(quiero|quiere|quisiera|ojala|deseo|desea) desaparecer",
    r"acabar con todo",
    r"no aguanto mas",
    r"(hacer(me|se)|me hago|se hace|me hice|se hizo|me he hecho|se ha hecho) dano",
    r"lastimar(me|se)\b",
    r"cortar(me|se)\b" + _NO_AUTOLESION,
    r"\b(me|se) (corto|corte|corta|cortaba|ha cortado|he cortado|esta cortando|estoy cortando)\b"
    + _NO_AUTOLESION,
    # Amenazas graves y armas
    r"\b(me|te|lo|la|le|nos|los|las) (va|van|iba|iban|voy|vamos) a matar",
    r"\b(me|te|lo|la|los|las) (quiere|quieren|queria|piensa|piensan) matar",
    r"\bmatar(me|te|lo|la|nos|los|las|se)\b",
    r"\b(te|lo|la|los|las) (mato|matare|mataria|matamos|vamos a matar)\b",
    r"apunal|acuchill|balazo|pegar(me|te|le)? un tiro",
    r"(trae|traer|trajo|tiene|tenia|lleva|llevar|llevo|saco|con) (un|una) "
    r"(arma|pistola|revolver|cuchillo|navaja)(?! de (agua|juguete|plastico))",
    # Violencia sexual
    r"abuso sexual",
    r"abus(a|o|aba|aron) (sexualmente )?de (mi|ella|el)\b",
    r"\b(me|la|lo|le) (violo|violaron|quiso violar|intento violar)\b",
    r"\b(me|la|lo|le|nos) (obliga|obligo|obligaba|obligan|obligaron) a (desvestir|quitar(me|se) la ropa"
    r"|tocar|besar|tener relaciones|mandar(le)? fotos|enviar(le)? fotos)",
    r"fotos? intimas?",
    r"fotos? desnud",
    r"tocamiento",
    r"manose",
    r"\b(me|nos|la|lo|le) (toca|toco|tocaba) .{0,40}(incomod|cuerpo|partes|no (le )?cuente|secreto)",
]


def _normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def detectar_riesgo_critico(texto: str) -> bool:
    limpio = _normalizar(texto)
    return any(re.search(p, limpio) for p in PATRONES_CRITICOS)
