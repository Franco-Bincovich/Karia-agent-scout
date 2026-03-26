# KarIA Escobar

Agente conversacional para análisis de documentos empresariales. Permite subir PDFs, Excel, Word, CSV y TXT, interpretarlos con IA y generar reportes o planillas a partir del contenido.

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (solo para desarrollo local sin Docker)
- Archivo `.env` configurado (ver `.env.example`)

## Instalación

```bash
cp .env.example .env
# Completar las variables en .env
```

Aplicar las migraciones en Supabase (en orden):

```
migrations/001_create_users.sql
migrations/002_create_conversaciones.sql
```

## Cómo correr

```bash
# Con Docker (producción / staging)
docker compose up --build

# Desarrollo local sin Docker
npm install && npm run dev
```
