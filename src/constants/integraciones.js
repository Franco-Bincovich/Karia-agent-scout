// constants/integraciones.js
// Constantes de dominio compartidas entre routes, controllers y services
// de integraciones. Un solo lugar para agregar o quitar tipos y servicios.

/** Tipos de integraciones válidos para DELETE /api/integraciones/:tipo */
const TIPOS_VALIDOS = ['anthropic', 'openai', 'gmail', 'drive', 'calendar'];

/** Scopes OAuth2 requeridos por cada servicio de Google Workspace */
const SCOPES_POR_SERVICIO = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  drive: ['https://www.googleapis.com/auth/drive.readonly'],
  calendar: ['https://www.googleapis.com/auth/calendar'],
};

/** Servicios de Google disponibles (derivado de SCOPES_POR_SERVICIO) */
const SERVICIOS_VALIDOS = Object.keys(SCOPES_POR_SERVICIO);

module.exports = { TIPOS_VALIDOS, SCOPES_POR_SERVICIO, SERVICIOS_VALIDOS };
