-- migrations/001_create_users.sql
-- Tabla de usuarios del sistema KarIA Escobar.
-- needs_password_reset: flag para forzar cambio de contraseña en primer login.
-- rol: 'admin' gestiona el sistema. 'analista' usa el agente.

CREATE TABLE IF NOT EXISTS "usuarios-escobar" (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT        UNIQUE NOT NULL,
  password_hash        TEXT        NOT NULL,
  nombre               TEXT        NOT NULL,
  rol                  TEXT        NOT NULL DEFAULT 'analista' CHECK (rol IN ('admin', 'analista')),
  needs_password_reset BOOLEAN     NOT NULL DEFAULT false,
  activo               BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: cada usuario solo ve su propio registro
ALTER TABLE "usuarios-escobar" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_escobar_own_row" ON "usuarios-escobar"
  FOR ALL USING (auth.uid()::text = id::text);
