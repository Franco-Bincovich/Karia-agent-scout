-- migrations/002_create_conversaciones.sql
-- Historial de conversaciones del agente por usuario.
-- messages: array JSONB con { role: 'user'|'assistant', content: string, timestamp }

CREATE TABLE IF NOT EXISTS "conversaciones-escobar" (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES "usuarios-escobar"(id) ON DELETE CASCADE,
  titulo     TEXT,
  messages   JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversaciones_escobar_user_id   ON "conversaciones-escobar"(user_id);
CREATE INDEX idx_conversaciones_escobar_updated_at ON "conversaciones-escobar"(updated_at DESC);

ALTER TABLE "conversaciones-escobar" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversaciones_escobar_own_rows" ON "conversaciones-escobar"
  FOR ALL USING (user_id = auth.uid()::uuid);
