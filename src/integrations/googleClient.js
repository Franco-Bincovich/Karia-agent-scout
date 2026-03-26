// integrations/googleClient.js
// Crea un cliente OAuth2 autenticado para un usuario.
// Maneja refresh automático y persiste los nuevos tokens en Supabase.

const { google } = require('googleapis');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const integracionService = require('../services/integracionService');
const logger = require('../utils/logger').child({ module: 'googleClient' });

const SERVICIOS_GOOGLE = ['gmail', 'drive', 'calendar'];

// Deduplicación de refreshes concurrentes: evita que dos requests simultáneos
// con el mismo token expirado lancen dos llamadas a refreshAccessToken para el mismo userId.
const refreshInFlight = new Map(); // userId → Promise<credentials>

/**
 * Refresca el access_token y persiste los nuevos tokens en todos los servicios Google.
 * Si ya hay un refresh en curso para ese userId devuelve la misma promesa.
 *
 * @param {string} userId
 * @param {string} refreshToken - refresh_token vigente
 * @returns {Promise<Object>} credentials de googleapis
 */
async function _refreshAndPersist(userId, refreshToken) {
  if (refreshInFlight.has(userId)) return refreshInFlight.get(userId);

  const promise = (async () => {
    const tempClient = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    tempClient.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await tempClient.refreshAccessToken();

    const resultados = await Promise.allSettled(
      SERVICIOS_GOOGLE.map((s) =>
        integracionService.guardarTokenGoogle(userId, s, {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || refreshToken,
          expiry: credentials.expiry_date,
        })
      )
    );
    resultados.forEach((r, i) => {
      if (r.status === 'rejected') {
        logger.warn('No se pudo persistir token Google', {
          userId,
          servicio: SERVICIOS_GOOGLE[i],
          error: r.reason?.message,
        });
      }
    });

    return credentials;
  })().finally(() => refreshInFlight.delete(userId));

  refreshInFlight.set(userId, promise);
  return promise;
}

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

  if (!config.google.clientId || !config.google.clientSecret) {
    throw new AppError(
      'Configurá las credenciales de Google Cloud Console en la sección Integraciones.',
      'GOOGLE_CREDENTIALS_MISSING',
      400
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
  const expiry = creds.expiry ? parseInt(creds.expiry, 10) : null;
  const expirado = expiry && Date.now() >= expiry - 60_000;

  if (expirado && creds.refresh_token) {
    try {
      const credentials = await _refreshAndPersist(userId, creds.refresh_token);
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
