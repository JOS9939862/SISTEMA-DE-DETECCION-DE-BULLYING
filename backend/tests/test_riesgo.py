import pytest

from services.riesgo import detectar_riesgo_critico


def test_texto_normal_no_es_riesgo_critico():
    texto = "Un estudiante me molesta constantemente durante las clases."

    resultado = detectar_riesgo_critico(texto)

    assert resultado is False


def test_autolesion_es_riesgo_critico():
    texto = "Estoy pensando en hacerme daño y no sé qué hacer."

    resultado = detectar_riesgo_critico(texto)

    assert resultado is True


def test_amenaza_es_riesgo_critico():
    texto = "Me amenazó con matarme si cuento lo que pasó."

    resultado = detectar_riesgo_critico(texto)

    assert resultado is True


@pytest.mark.parametrize(
    "texto",
    [
        "Me dijo que me iba a matar a la salida.",
        "Voy a acabar con mi vida.",
        "Me corto los brazos cuando llego a casa.",
        "Pienso en cortarme otra vez.",
        "Dice que quiere matarlo.",
        "Lo van a matar si vuelve al colegio.",
        "Un compañero trajo un cuchillo a clase.",
        "Quisiera estar muerta.",
        "Me obligó a mandarle fotos.",
        "Me tocó las partes y me dijo que era un secreto.",
        "Me quiero suicidar.",
        # En tercera persona (denuncias hechas por testigos)
        "Mi amiga se corta los brazos.",
        "Dice que se va a matar.",
        "Mi compañero se quiere morir.",
        "Se quiere matar.",
        "Se hace daño en el baño.",
        "Quiere suicidarse.",
        "Su compañero la quiere matar.",
        "Abusaron de ella en la fiesta.",
        "A ella la obligaron a mandarle fotos.",
        # En pasado y amenazas directas
        "Me corté los brazos ayer.",
        "Me dijo te mato si hablas.",
        "Dijo que lo iba a apuñalar.",
        "Me amenazó con un cuchillo.",
    ],
)
def test_frases_criticas_son_detectadas(texto):
    assert detectar_riesgo_critico(texto) is True


@pytest.mark.parametrize(
    "texto",
    [
        "Me tocó un trabajo de grupo con él y no me ayuda.",
        "No quiero seguir en este colegio porque se burlan de mí.",
        "Me obligó a hacer su tarea.",
        "Mañana me corto el pelo.",
        "Se cortó el pelo muy corto y se burlan.",
        "Se ríen de mí en el recreo.",
        "Trajo una pistola de agua al recreo.",
        "Metió un tiro libre en el partido.",
    ],
)
def test_frases_comunes_no_son_criticas(texto):
    assert detectar_riesgo_critico(texto) is False
