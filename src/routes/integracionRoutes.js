// routes/integracionRoutes.js
// Routing + validación de entrada para /api/integraciones.
// Sin lógica de negocio — todo pasa al controller.

const { Router } = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const {
  listar,
  conectarApiKey,
  conectarGoogle,
  callbackGoogle,
  desconectar,
} = require('../controllers/integracionController');

const TIPOS_VALIDOS = ['anthropic', 'openai', 'gmail', 'drive', 'calendar'];

const router = Router();

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiadas solicitudes, intentá de nuevo más tarde',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

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

// GET /api/integraciones/google/auth  (inicia flujo OAuth2)
router.get('/google/auth', verificarToken, apiRateLimiter, conectarGoogle);

// GET /api/integraciones/google/callback  (Google redirige aquí, sin JWT propio)
router.get('/google/callback', callbackGoogle);

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
