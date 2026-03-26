// routes/funcionalidadRoutes.js
// Routing + validación de entrada para /api/funcionalidades.
// Sin lógica de negocio — todo pasa al controller.

const { Router } = require('express');
const { body, param } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { listar, crear, toggleActivo } = require('../controllers/funcionalidadController');

const router = Router();

// GET /api/funcionalidades
router.get('/', verificarToken, listar);

// POST /api/funcionalidades
router.post(
  '/',
  verificarToken,
  [
    body('nombre').isString().trim().notEmpty().withMessage('nombre es requerido'),
    body('system_prompt').isString().trim().notEmpty().withMessage('system_prompt es requerido'),
    body('descripcion').optional({ nullable: true }).isString().trim(),
  ],
  manejarErroresValidacion,
  crear
);

// PATCH /api/funcionalidades/:id/toggle
router.patch(
  '/:id/toggle',
  verificarToken,
  [param('id').isUUID().withMessage('id debe ser un UUID válido')],
  manejarErroresValidacion,
  toggleActivo
);

module.exports = router;
