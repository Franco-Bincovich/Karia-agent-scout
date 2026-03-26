// controllers/integracionController.js
// Solo orquestación — sin lógica de negocio.
// El flujo OAuth2 de Google se maneja aquí porque implica redirects HTTP,
// que son responsabilidad de la capa de transporte, no de services.

const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const integracionService = require('../services/integracionService');
const logger = require('../utils/logger').child({ module: 'integracionController' });

const SCOPES_POR_SERVICIO = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  drive: ['https://www.googleapis.com/auth/drive.readonly'],
  calendar: ['https://www.googleapis.com/auth/calendar'],
};

const SERVICIOS_VALIDOS = Object.keys(SCOPES_POR_SERVICIO);

/**
 * Crea un cliente OAuth2 usando credenciales del usuario si vienen en query,
 * o las del servidor desde config. Lanza AppError 400 si no hay ninguna.
 * @param {string} [clientId]
 * @param {string} [clientSecret]
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

/**
 * GET /api/integraciones
 * Devuelve las integraciones activas del usuario autenticado (sin credenciales).
 */
async function listar(req, res, next) {
  try {
    const integraciones = await integracionService.listarIntegraciones(req.user.userId);
    res.json({ integraciones });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/integraciones/apikey
 * Body: { tipo: 'anthropic'|'openai', apiKey: string }
 */
async function conectarApiKey(req, res, next) {
  try {
    const { tipo, apiKey } = req.body;
    const resultado = await integracionService.guardarApiKey(req.user.userId, tipo, apiKey);
    res.json({ ok: true, tipo: resultado.tipo });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integraciones/google/auth?servicios=gmail,drive,calendar
 * Devuelve la URL de autorización de Google con los scopes de los servicios seleccionados.
 * El userId y los servicios se codifican en el state (JWT firmado, 10 min de vida).
 *
 * @query {string} servicios - servicios separados por coma (gmail|drive|calendar)
 */
async function conectarGoogle(req, res, next) {
  try {
    const raw = typeof req.query.servicios === 'string' ? req.query.servicios : '';
    const servicios = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => SERVICIOS_VALIDOS.includes(s));

    if (servicios.length === 0) {
      return next(
        new AppError(
          `Seleccioná al menos un servicio: ${SERVICIOS_VALIDOS.join(', ')}`,
          'SERVICIOS_REQUERIDOS',
          400
        )
      );
    }

    const clientId = typeof req.query.clientId === 'string' ? req.query.clientId.trim() : '';
    const clientSecret =
      typeof req.query.clientSecret === 'string' ? req.query.clientSecret.trim() : '';

    const oauthClient = crearOAuthClient(clientId || null, clientSecret || null);

    const scopes = servicios.flatMap((s) => SCOPES_POR_SERVICIO[s]);
    const estado = jwt.sign({ userId: req.user.userId, servicios }, config.jwt.secret, {
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
 * Intercambia el code por tokens y los guarda para gmail + drive + calendar.
 * No requiere JWT propio — el userId viene en el state firmado.
 */
async function callbackGoogle(req, res, next) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return next(
        new AppError(`Google rechazó la autorización: ${oauthError}`, 'GOOGLE_AUTH_DENIED', 400)
      );
    }

    // Verificar state firmado para obtener userId y servicios
    let userId;
    let serviciosState;
    try {
      const payload = jwt.verify(state, config.jwt.secret);
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

/**
 * DELETE /api/integraciones/:tipo
 */
async function desconectar(req, res, next) {
  try {
    const { tipo } = req.params;
    await integracionService.desconectar(req.user.userId, tipo);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, conectarApiKey, conectarGoogle, callbackGoogle, desconectar };
