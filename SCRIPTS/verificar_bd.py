"""Verifica que la base de datos bullying_db este correctamente configurada.

Uso:
    pip install pymysql python-dotenv
    python scripts/verificar_bd.py

Lee la configuracion del archivo .env (ver .env.example).
Comprueba cuatro cosas, en orden, y se detiene en la primera que falle:
  1. Que el servidor MySQL responda.
  2. Que la base de datos bullying_db exista.
  3. Que el charset sea utf8mb4 (si no, los emojis se pierden).
  4. Que realmente se puedan guardar y leer emojis y tildes.
"""

import os
import sys

try:
    import pymysql
except ImportError:
    sys.exit("Falta la dependencia. Ejecuta:  pip install pymysql python-dotenv")

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    print("Aviso: python-dotenv no esta instalado, se usaran las variables "
          "de entorno del sistema.\n")

HOST = os.getenv("DB_HOST", "127.0.0.1")
PORT = int(os.getenv("DB_PORT", "3306"))
USER = os.getenv("DB_USER", "bullying_user")
PASSWORD = os.getenv("DB_PASSWORD", "")
NAME = os.getenv("DB_NAME", "bullying_db")

OK = "[OK]  "
FAIL = "[FALLA]"


def main() -> int:
    print(f"Conectando a {USER}@{HOST}:{PORT} ...\n")

    # 1. Conexion al servidor
    try:
        conexion = pymysql.connect(
            host=HOST, port=PORT, user=USER, password=PASSWORD,
            charset="utf8mb4",
        )
    except pymysql.err.OperationalError as error:
        codigo = error.args[0]
        print(f"{FAIL} No se pudo conectar: {error}\n")
        if codigo == 2003:
            print("  Causa probable: MySQL no esta corriendo.")
            print("  Solucion: abre Laragon y pulsa 'Iniciar todo'.")
        elif codigo == 1044:
            print(f"  Causa probable: el usuario existe pero no tiene "
                  f"permisos sobre '{NAME}'.")
            print("  Solucion: ejecuta database/02_crear_usuario.sql como root.")
        elif codigo == 1045:
            print("  Causa probable: usuario o password incorrectos.")
            print("  Solucion: revisa DB_USER y DB_PASSWORD en tu .env y")
            print("  confirma que ejecutaste database/02_crear_usuario.sql")
            print("  con la MISMA password que pusiste en el .env.")
        return 1
    print(f"{OK} Servidor MySQL responde.")

    with conexion:
        with conexion.cursor() as cursor:
            # 2 y 3. Existencia y charset de la base de datos
            cursor.execute(
                "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME "
                "FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = %s",
                (NAME,),
            )
            fila = cursor.fetchone()
            if fila is None:
                print(f"{FAIL} La base de datos '{NAME}' no existe.")
                print("  Solucion: ejecuta database/01_crear_base_datos.sql")
                return 1
            charset, collation = fila
            print(f"{OK} Base de datos '{NAME}' existe.")

            if charset != "utf8mb4":
                print(f"{FAIL} charset = '{charset}', se esperaba 'utf8mb4'.")
                print("  Con otro charset los emojis se pierden al guardarse.")
                print(f"  Solucion: ALTER DATABASE {NAME} CHARACTER SET "
                      "utf8mb4 COLLATE utf8mb4_unicode_ci;")
                return 1
            print(f"{OK} Charset correcto: {charset} / {collation}")

            # 4. Prueba real de escritura y lectura con emojis.
            # Se usa una tabla normal y no una TEMPORARY a proposito: las
            # temporales exigen el privilegio CREATE TEMPORARY TABLES, que
            # el usuario de la app no necesita, y ademas una tabla normal
            # comprueba el almacenamiento real en disco. Se borra siempre
            # en el finally, incluso si la prueba falla a la mitad.
            cursor.execute(f"USE `{NAME}`")
            cursor.execute("DROP TABLE IF EXISTS _verificacion_utf8")
            try:
                cursor.execute(
                    "CREATE TABLE _verificacion_utf8 (texto VARCHAR(255)) "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
                muestra = (
                    "Prueba de acentuacion: ninos, agresion "
                    "\U0001F600\U0001F494"
                )
                cursor.execute(
                    "INSERT INTO _verificacion_utf8 (texto) VALUES (%s)",
                    (muestra,),
                )
                conexion.commit()
                cursor.execute("SELECT texto FROM _verificacion_utf8")
                devuelto = cursor.fetchone()[0]
            finally:
                cursor.execute("DROP TABLE IF EXISTS _verificacion_utf8")
                conexion.commit()

            if devuelto != muestra:
                print(f"{FAIL} El texto cambio al guardarse en la base.")
                print(f"  Se guardo:   {muestra!r}")
                print(f"  Se leyo:     {devuelto!r}")
                print("  Causa probable: la conexion no usa utf8mb4.")
                return 1
            print(f"{OK} Emojis y tildes se guardan y leen sin perdida.")

    print("\nTodo correcto. La base de datos esta lista para usarse.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
