# Configuración de la base de datos

Guía para dejar `bullying_db` funcionando en tu máquina local con Laragon.
Tiempo estimado: 10 minutos.

---

## 1. Requisitos

- **Laragon** (edición Full) — https://laragon.org/download/
- Durante la instalación, dejar marcada la opción de MySQL.

---

## 2. Levantar Laragon y arrancar MySQL

1. Abrir Laragon.
2. Pulsar **Iniciar todo** (*Start All*).
3. Verificar que el indicador de **MySQL** quede en verde.

Si MySQL no arranca, ver la sección [Problemas frecuentes](#6-problemas-frecuentes).

---

## 3. Crear la base de datos

Abrir la consola de Laragon en **Menú → MySQL → Console** (se conecta como
`root` automáticamente) y ejecutar, desde la raíz del proyecto:

```sql
SOURCE database/01_crear_base_datos.sql;
```

O, alternativamente, desde la terminal de Laragon:

```bash
mysql -u root -p < database/01_crear_base_datos.sql
```

> La password de `root` en Laragon está **vacía** por defecto: cuando pida la
> contraseña, simplemente pulsa Enter.

El script deja `bullying_db` creada con charset **utf8mb4**. Esto no es un
detalle cosmético: los mensajes que va a analizar el sistema traen tildes,
eñes y **emojis**. Los emojis ocupan 4 bytes y el `utf8` antiguo de MySQL
solo admite 3, así que con el charset equivocado se perderían justo las
señales que más peso tienen al clasificar acoso.

---

## 4. Crear el usuario de la aplicación

1. Abrir `database/02_crear_usuario.sql`.
2. Reemplazar `CAMBIAR_ESTA_PASSWORD` por la password acordada en el grupo.
3. Ejecutarlo igual que el anterior:

```sql
SOURCE database/02_crear_usuario.sql;
```

**No conectamos la aplicación como `root`.** Laragon deja `root` sin
password y con permisos sobre todo el servidor; si el backend se conectara
así, cualquier fallo de inyección SQL comprometería el servidor MySQL
completo. Además, en producción ese usuario no va a existir, y es preferible
que el código se escriba desde el primer día contra el usuario definitivo.

---

## 5. Configurar el `.env` y verificar

```bash
# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Editar el `.env` y poner la password real en `DB_PASSWORD` y en
`DATABASE_URL`. Después, comprobar que todo quedó bien:

```bash
pip install pymysql python-dotenv
python scripts/verificar_bd.py
```

Salida esperada:

```
[OK]   Servidor MySQL responde.
[OK]   Base de datos 'bullying_db' existe.
[OK]   Charset correcto: utf8mb4 / utf8mb4_unicode_ci
[OK]   Emojis y tildes se guardan y leen sin pérdida.

Todo correcto. La base de datos está lista para usarse.
```

Si algo falla, el script dice cuál es la causa probable y cómo corregirla.

⚠️ **El archivo `.env` nunca se sube al repositorio.** Ya está cubierto por
`.gitignore`. Lo que se versiona es `.env.example`, con valores de ejemplo.

---

## 6. Problemas frecuentes

### `Can't connect to MySQL server` (error 2003)

MySQL no está corriendo. Abrir Laragon y pulsar *Iniciar todo*.

Si aun así no arranca, lo más común es que el **puerto 3306 esté ocupado**
por otra instalación de MySQL (XAMPP, WAMP o un MySQL instalado como
servicio de Windows). Para comprobarlo, en CMD como administrador:

```bash
netstat -ano | findstr :3306
```

Si aparece un proceso, hay dos salidas: detener ese servicio
(`services.msc` → MySQL → Detener), o cambiar el puerto de Laragon en
**Menú → MySQL → my.ini** y actualizar `DB_PORT` en el `.env`.

### `Access denied for user` (error 1045)

La password del `.env` no coincide con la que se usó al crear el usuario.
Volver a ejecutar `database/02_crear_usuario.sql` con la password correcta,
o restablecerla:

```sql
ALTER USER 'bullying_user'@'localhost' IDENTIFIED BY 'la_password_correcta';
ALTER USER 'bullying_user'@'127.0.0.1' IDENTIFIED BY 'la_password_correcta';
FLUSH PRIVILEGES;
```

### `Access denied` aunque la password sea correcta

MySQL identifica a un usuario por la pareja *(nombre, host de origen)*, y
`localhost` y `127.0.0.1` **no son el mismo host** para el servidor. Por eso
el script crea el usuario para ambos. Si se editó el script y se dejó solo
uno, este es el motivo del rechazo.

### Los emojis se guardan como `????`

La conexión no está usando utf8mb4. Revisar que `DB_CHARSET=utf8mb4` esté en
el `.env` y que la cadena `DATABASE_URL` termine en `?charset=utf8mb4`.

### `Authentication plugin 'caching_sha2_password' cannot be loaded`

Pasa con clientes antiguos contra MySQL 8. Solución:

```sql
ALTER USER 'bullying_user'@'localhost'
    IDENTIFIED WITH mysql_native_password BY 'la_password';
FLUSH PRIVILEGES;
```

---

## 7. Credenciales

Las credenciales **no se guardan en este repositorio**. Se comparten por el
grupo del equipo y cada integrante las coloca en su `.env` local.

| Parámetro | Valor |
|---|---|
| Motor | MySQL (Laragon) |
| Host | `127.0.0.1` |
| Puerto | `3306` |
| Base de datos | `bullying_db` |
| Charset | `utf8mb4` / `utf8mb4_unicode_ci` |
| Usuario de aplicación | `bullying_user` |
| Password | *compartida por el grupo* |
| Usuario administrador | `root` (sin password, valor por defecto de Laragon) |

Estas credenciales son **solo para desarrollo local**. El entorno de
producción usará credenciales distintas, gestionadas aparte.
