// integrations/googleClient.js
// Crea un cliente OAuth2 autenticado para un usuario.
// Maneja refresh automático y persiste los nuevos tokens en Supabase.

const { google } = require('googleapis');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const integracionService = require('../services/integracionService');
const logger = require('../utils/logger').child({ module: 'googleClient' });

const SERVICIOS_GOOGLE = ['gmail', 'drive', 'calendar'];

/**
 * Devuelve un cliente OAuth2 autenticado y listo para usar.
 * Refresca el access_token automáticamente si expiró.
 *
 * @param {string} userId
 * @param {'gmail'|'drive'|'calendar'} tipo - servicio que se va a usar
 * @returns {Promise<import('googleapis').Auth.OAuth2Client>}
 * @throws {AppError} GOOGLE_NOT_CONNECTED | GOOGLE_CREDENTIALS_MISSING | GOOGLE_TOKEN_EXPIRED
 */
async function getGoogleClient(userId, tipo) {
  let creds;
  try {
    creds = await integracionService.getCredenciales(userId, tipo);
  } catch (err) {
    if (err.code === 'INTEGRACION_NOT_FOUND' || err.code === 'INTEGRACION_INACTIVA') {
      throw new AppError(
        `Google ${tipo} no está conectado. Conectá tu cuenta desde la sección Integraciones del menú.`,
        'GOOGLE_NOT_CONNECTED',
        400
      );
    }
    throw err;
  }

  const clientId = config.google.clientId;
  const clientSecret = config.google.clientSecret;

  if (!clientId || !clientSecret) {
    throw new AppError(
      'Configurá las credenciales de Google Cloud Console en la sección Integraciones.',
      'GOOGLE_CREDENTIALS_MISSING',
      400
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, config.google.redirectUri);
  const expiry = creds.expiry ? parseInt(creds.expiry, 10) : null;
  const expirado = expiry && Date.now() >= expiry - 60_000;

  if (expirado && creds.refresh_token) {
    try {
      oauth2Client.setCredentials({ refresh_token: creds.refresh_token });
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Persistir token nuevo en todos los servicios Google del usuario
      await Promise.allSettled(
        SERVICIOS_GOOGLE.map((s) =>
          integracionService.guardarTokenGoogle(userId, s, {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || creds.refresh_token,
            expiry: credentials.expiry_date,
          })
        )
      );

      oauth2Client.setCredentials(credentials);
      logger.info('Token Google refrescado', { userId, tipo });
    } catch (_) {
      throw new AppError(
        'La sesión de Google expiró. Volvé a conectar tu cuenta desde Integraciones.',
        'GOOGLE_TOKEN_EXPIRED',
        401
      );
    }
  } else {
    oauth2Client.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: expiry,
    });
  }

  return oauth2Client;
}

module.exports = { getGoogleClient };
