-- migrations/003_grant_permissions.sql
-- Permisos PostgREST para las tablas del esquema público.
-- service_role: acceso total (bypass RLS) — usado por el backend Node.js.
-- authenticated: acceso restringido por RLS — usado por clients directos (no aplica en este proyecto).
-- anon: sin acceso — las tablas no son públicas.

GRANT ALL ON "usuarios-escobar"      TO service_role;
GRANT ALL ON "conversaciones-escobar" TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON "usuarios-escobar"       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "conversaciones-escobar" TO authenticated;

REVOKE ALL ON "usuarios-escobar"      FROM anon;
REVOKE ALL ON "conversaciones-escobar" FROM anon;
