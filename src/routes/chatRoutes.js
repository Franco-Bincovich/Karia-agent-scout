// routes/chatRoutes.js
// Routing + validación de entrada para /api/chat.

const { Router } = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const {
  chat,
  listarConversaciones,
  cargarConversacion,
  chatConfigurador,
} = require('../controllers/chatController');

const router = Router();

const chatRateLimiter = rateLimit({
  windowMs: config.rateLimit.chat.windowMs,
  max: config.rateLimit.chat.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiados mensajes, esperá un momento',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// POST /api/chat
router.post(
  '/',
  verificarToken,
  chatRateLimiter,
  [
    body('mensaje')
      .isString()
      .withMessage('El mensaje debe ser texto')
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage('El mensaje debe tener entre 1 y 4000 caracteres'),
    body('conversacionId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID()
      .withMessage('conversacionId debe ser un UUID válido'),
  ],
  manejarErroresValidacion,
  chat
);

// POST /api/chat/configurador  — sin persistencia de historial
router.post(
  '/configurador',
  verificarToken,
  chatRateLimiter,
  [
    body('mensaje')
      .isString()
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage('mensaje requerido, máx 4000 chars'),
    body('historial').optional().isArray().withMessage('historial debe ser un array'),
  ],
  manejarErroresValidacion,
  chatConfigurador
);

// GET /api/conversaciones
const conversacionesRouter = Router();

conversacionesRouter.get('/', verificarToken, listarConversaciones);

conversacionesRouter.get(
  '/:id',
  verificarToken,
  [param('id').isUUID().withMessage('El id debe ser un UUID válido')],
  manejarErroresValidacion,
  cargarConversacion
);

module.exports = { chatRouter: router, conversacionesRouter };
