// integrations/googleOAuthFactory.js
// Fábrica del cliente OAuth2 de Google. Integración pura — sin lógica HTTP.

const { google } = require('googleapis');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * Crea y devuelve un cliente OAuth2 de Google.
 * Usa las credenciales recibidas como parámetro si se proveyeron;
 * si no, cae a las del servidor definidas en config.
 *
 * @param {string|null} [clientId]     - Client ID de Google Cloud Console (opcional)
 * @param {string|null} [clientSecret] - Client Secret de Google Cloud Console (opcional)
 * @returns {import('googleapis').Auth.OAuth2Client}
 * @throws {AppError} GOOGLE_CREDENTIALS_MISSING (400) si no hay credenciales disponibles
 */
function crearOAuthClient(clientId, clientSecret) {
  const id = clientId || config.google.clientId;
  const secret = clientSecret || config.google.clientSecret;

  if (!id || !secret) {
    throw new AppError(
      'Configurá tus credenciales de Google Cloud Console en la sección Integraciones',
      'GOOGLE_CREDENTIALS_MISSING',
      400
    );
  }

  return new google.auth.OAuth2(id, secret, config.google.redirectUri);
}

module.exports = { crearOAuthClient };
