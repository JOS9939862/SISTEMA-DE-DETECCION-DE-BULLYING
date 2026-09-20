-- =====================================================================
-- Sistema de Deteccion de Bullying
-- Script 02: Usuario de aplicacion
-- =====================================================================
-- IMPORTANTE: antes de ejecutar, reemplaza CAMBIAR_ESTA_PASSWORD por la
-- password que el equipo acordo en el grupo. NO se guarda en el repo.
--
-- Por que no usamos root en la app:
-- Laragon trae root SIN password. Si el backend se conecta como root,
-- cualquier fallo de inyeccion SQL compromete el servidor MySQL entero,
-- y ademas el codigo quedaria escrito para un usuario que en produccion
-- no va a existir. Mejor trabajar desde el dia 1 igual que en produccion.
-- =====================================================================

-- Se crea el usuario para 'localhost' Y para '127.0.0.1' a proposito.
-- MySQL identifica al usuario por la pareja (nombre, host de origen), y
-- esos dos hosts NO son equivalentes: si el servidor corre con
-- skip-name-resolve, una conexion TCP a 127.0.0.1 no resuelve a
-- 'localhost' y el login falla con "Access denied" aunque la password
-- sea correcta. Crear ambos evita ese error, que es de los que mas
-- tiempo hacen perder por lo confuso del mensaje.
CREATE USER IF NOT EXISTS 'bullying_user'@'localhost'
    IDENTIFIED BY 'CAMBIAR_ESTA_PASSWORD';
CREATE USER IF NOT EXISTS 'bullying_user'@'127.0.0.1'
    IDENTIFIED BY 'CAMBIAR_ESTA_PASSWORD';

-- Permisos solo sobre bullying_db, no sobre todo el servidor.
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
    ON bullying_db.*
    TO 'bullying_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
    ON bullying_db.*
    TO 'bullying_user'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Verificacion de permisos otorgados
SHOW GRANTS FOR 'bullying_user'@'localhost';
SHOW GRANTS FOR 'bullying_user'@'127.0.0.1';
