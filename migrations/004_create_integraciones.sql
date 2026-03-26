-- migrations/004_create_integraciones.sql
-- Integraciones de terceros por usuario: API keys y tokens OAuth.
-- credenciales: JSONB cifrado en capa de servicio — nunca plain text en DB.
-- UNIQUE(user_id, tipo): un usuario tiene una sola integración activa por tipo.

CREATE TABLE IF NOT EXISTS "integraciones-escobar" (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES "usuarios-escobar"(id) ON DELETE CASCADE,
  tipo         TEXT        NOT NULL CHECK (tipo IN ('anthropic', 'openai', 'gmail', 'drive', 'calendar', 'perplexity', 'gamma')),
  credenciales JSONB       NOT NULL DEFAULT '{}',
  activo       BOOLEAN     NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tipo)
);

CREATE INDEX idx_integraciones_escobar_user_id ON "integraciones-escobar"(user_id);

ALTER TABLE "integraciones-escobar" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integraciones_escobar_own_rows" ON "integraciones-escobar"
  FOR ALL USING (user_id = auth.uid()::uuid);

-- PostgREST: el backend Node.js usa service_role (bypass RLS).
-- authenticated hereda restricción de RLS. anon sin acceso.
GRANT ALL ON "integraciones-escobar" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "integraciones-escobar" TO authenticated;
REVOKE ALL ON "integraciones-escobar" FROM anon;

-- ── Actualización del CHECK constraint (ejecutar en Supabase SQL Editor) ──────
-- Correr esto si la tabla ya existe:
--
-- ALTER TABLE "integraciones-escobar"
--   DROP CONSTRAINT IF EXISTS integraciones_escobar_tipo_check;
-- ALTER TABLE "integraciones-escobar"
--   ADD CONSTRAINT integraciones_escobar_tipo_check
--   CHECK (tipo IN ('anthropic', 'openai', 'gmail', 'drive', 'calendar', 'perplexity', 'gamma'));
