-- =====================================================================
-- Sistema de Deteccion de Bullying
-- Script 01: Creacion de la base de datos
-- =====================================================================
-- Ejecutar como root desde Laragon (Menu > MySQL > Console) o con:
--   mysql -u root -p < database/01_crear_base_datos.sql
-- =====================================================================

-- utf8mb4 es OBLIGATORIO en este proyecto, no opcional:
-- los mensajes que analizaremos contienen tildes, enies y sobre todo
-- emojis (4 bytes). El utf8 "viejo" de MySQL solo soporta 3 bytes y
-- truncaria o rechazaria cualquier texto con emoji, perdiendo justo
-- las senales que mas pesan al clasificar acoso.
CREATE DATABASE IF NOT EXISTS bullying_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Verificacion: debe devolver utf8mb4 / utf8mb4_unicode_ci
SELECT
    SCHEMA_NAME                 AS base_de_datos,
    DEFAULT_CHARACTER_SET_NAME  AS charset,
    DEFAULT_COLLATION_NAME      AS collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'bullying_db';
