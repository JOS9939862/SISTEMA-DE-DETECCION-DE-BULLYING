from security import (
    crear_token,
    decodificar_token,
    hash_password,
    verify_password,
)


def test_password_correcta_es_validada():
    password = "ClaveSegura123!"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_password_incorrecta_es_rechazada():
    password = "ClaveSegura123!"
    hashed = hash_password(password)

    assert verify_password("ClaveIncorrecta", hashed) is False


def test_token_se_crea_y_se_decodifica():
    token = crear_token(1, "admin")

    datos = decodificar_token(token)

    assert datos is not None
    assert datos["sub"] == "1"
    assert datos["rol"] == "admin"


def test_token_invalido_es_rechazado():
    datos = decodificar_token("token-inventado")

    assert datos is None