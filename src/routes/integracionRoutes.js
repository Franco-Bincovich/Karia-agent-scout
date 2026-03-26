// routes/integracionRoutes.js
// Routing + validación de entrada para /api/integraciones.
// Sin lógica de negocio — todo pasa al controller.

const { Router } = require('express');
const { body, param } = require('express-validator');
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

// GET /api/integraciones
router.get('/', verificarToken, listar);

// POST /api/integraciones/apikey
router.post(
  '/apikey',
  verificarToken,
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
router.get('/google/auth', verificarToken, conectarGoogle);

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
