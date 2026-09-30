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