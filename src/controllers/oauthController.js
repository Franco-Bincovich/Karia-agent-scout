// controllers/oauthController.js
// Flujo OAuth2 de Google: inicio de autorización y callback.

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const integracionService = require('../services/integracionService');
const logger = require('../utils/logger').child({ module: 'oauthController' });
const { SCOPES_POR_SERVICIO, SERVICIOS_VALIDOS } = require('../constants/integraciones');
const { crearOAuthClient } = require('../integrations/googleOAuthFactory');

/**
 * POST /api/integraciones/google/auth
 * Body: { servicios: string (csv), clientId?: string, clientSecret?: string }
 * Devuelve la URL de autorización de Google con los scopes correspondientes.
 * El userId y los servicios se codifican en el state (JWT firmado, 10 min).
 */
async function conectarGoogle(req, res, next) {
  try {
    const raw = typeof req.body.servicios === 'string' ? req.body.servicios : '';
    const servicios = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => SERVICIOS_VALIDOS.includes(s));

    if (servicios.length === 0)
      return next(
        new AppError(
          `Seleccioná al menos un servicio: ${SERVICIOS_VALIDOS.join(', ')}`,
          'SERVICIOS_REQUERIDOS',
          400
        )
      );

    const clientId = typeof req.body.clientId === 'string' ? req.body.clientId.trim() : '';
    const clientSecret =
      typeof req.body.clientSecret === 'string' ? req.body.clientSecret.trim() : '';
    const oauthClient = crearOAuthClient(clientId || null, clientSecret || null);

    const scopes = servicios.flatMap((s) => SCOPES_POR_SERVICIO[s]);
    const estado = jwt.sign({ userId: req.user.userId, servicios }, config.oauthStateSecret, {
      expiresIn: '10m',
    });

    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: estado,
      prompt: 'consent',
    });

    logger.info('Iniciando OAuth Google', { userId: req.user.userId, servicios });
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integraciones/google/callback
 * Google redirige aquí con ?code=...&state=...
 * Intercambia el code por tokens y los guarda para gmail/drive/calendar.
 * No requiere JWT de sesión — el userId viene en el state firmado.
 */
async function callbackGoogle(req, res, next) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError)
      return next(
        new AppError(`Google rechazó la autorización: ${oauthError}`, 'GOOGLE_AUTH_DENIED', 400)
      );

    let userId;
    let serviciosState;
    try {
      const payload = jwt.verify(state, config.oauthStateSecret);
      userId = payload.userId;
      serviciosState = Array.isArray(payload.servicios) ? payload.servicios : SERVICIOS_VALIDOS;
    } catch (_) {
      return next(new AppError('State OAuth inválido o expirado', 'OAUTH_STATE_INVALID', 400));
    }

    const { tokens } = await crearOAuthClient().getToken(code);
    const tokensPayload = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: tokens.expiry_date,
    };

    await Promise.all(
      serviciosState.map((s) => integracionService.guardarTokenGoogle(userId, s, tokensPayload))
    );

    logger.info('OAuth Google completado', { userId });
    const frontendUrl = config.allowedOrigins[0] || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?connected=google`);
  } catch (err) {
    next(err);
  }
}

module.exports = { conectarGoogle, callbackGoogle };
