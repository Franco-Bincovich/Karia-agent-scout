-- migrations/005_create_funcionalidades.sql
-- Funcionalidades personalizadas del agente por usuario.
-- Cada fila define un contexto / system_prompt activo para el agente de ese usuario.

CREATE TABLE IF NOT EXISTS "funcionalidades-escobar" (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES "usuarios-escobar"(id) ON DELETE CASCADE,
  nombre        TEXT        NOT NULL,
  descripcion   TEXT,
  system_prompt TEXT        NOT NULL,
  activo        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funcionalidades_escobar_user_id ON "funcionalidades-escobar"(user_id);

ALTER TABLE "funcionalidades-escobar" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcionalidades_escobar_own_rows" ON "funcionalidades-escobar"
  FOR ALL USING (user_id = auth.uid()::uuid);

GRANT ALL ON "funcionalidades-escobar" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "funcionalidades-escobar" TO authenticated;
-- anon no necesita acceso: la tabla es privada por diseño (RLS exige auth.uid()).
-- Si esta migración se corre sobre una BD existente, ejecutar además en SQL Editor:
-- REVOKE ALL ON "funcionalidades-escobar" FROM anon;
