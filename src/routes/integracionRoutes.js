// routes/integracionRoutes.js
// Routing + validación de entrada para /api/integraciones.
// Sin lógica de negocio — todo pasa al controller.

const { Router } = require('express');
const { body, param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { apiRateLimiter } = require('../middleware/rateLimiters');
const { listar, conectarApiKey, desconectar } = require('../controllers/integracionController');
const { conectarGoogle, callbackGoogle } = require('../controllers/oauthController');
const { TIPOS_VALIDOS } = require('../constants/integraciones');

const router = Router();

// GET /api/integraciones
router.get('/', verificarToken, listar);

// POST /api/integraciones/apikey
router.post(
  '/apikey',
  verificarToken,
  apiRateLimiter,
  [
    body('tipo')
      .isIn(['anthropic', 'openai', 'perplexity', 'gamma'])
      .withMessage("tipo debe ser 'anthropic', 'openai', 'perplexity' o 'gamma'"),
    body('apiKey').isString().trim().notEmpty().withMessage('apiKey es requerida'),
  ],
  manejarErroresValidacion,
  conectarApiKey
);

// POST /api/integraciones/google/auth  (inicia flujo OAuth2 — credenciales en body, no en URL)
router.post(
  '/google/auth',
  verificarToken,
  apiRateLimiter,
  [
    body('servicios').isString().trim().notEmpty().withMessage('Seleccioná al menos un servicio'),
    body('clientId').optional({ nullable: true }).isString().trim(),
    body('clientSecret').optional({ nullable: true }).isString().trim(),
  ],
  manejarErroresValidacion,
  conectarGoogle
);

// GET /api/integraciones/google/callback  (Google redirige aquí, sin JWT propio)
router.get('/google/callback', apiRateLimiter, callbackGoogle);

// DELETE /api/integraciones/:tipo
router.delete(
  '/:tipo',
  verificarToken,
  [
    param('tipo')
      .isIn(TIPOS_VALIDOS)
      .withMessage(`tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`),
  ],
  manejarErroresValidacion,
  desconectar
);

module.exports = router;
