// controllers/integracionController.js
// Orquestación de integraciones no-OAuth: listar, conectar API key, desconectar.
// El flujo OAuth2 de Google vive en oauthController.js.

const integracionService = require('../services/integracionService');

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
 * Body: { tipo: 'anthropic'|'openai'|'perplexity'|'gamma', apiKey: string }
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

module.exports = { listar, conectarApiKey, desconectar };
