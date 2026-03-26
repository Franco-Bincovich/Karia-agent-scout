// controllers/funcionalidadController.js
// Solo orquestación — sin lógica de negocio.
// Toda la lógica vive en funcionalidadService.js.

const funcionalidadService = require('../services/funcionalidadService');

/**
 * GET /api/funcionalidades
 * Devuelve las funcionalidades activas del usuario autenticado.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function listar(req, res, next) {
  try {
    const funcionalidades = await funcionalidadService.listar(req.user.userId);
    res.json({ funcionalidades });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/funcionalidades
 * Body: { nombre, descripcion?, system_prompt }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function crear(req, res, next) {
  try {
    const { nombre, descripcion, system_prompt } = req.body;
    const funcionalidad = await funcionalidadService.crear(req.user.userId, {
      nombre,
      descripcion,
      system_prompt,
    });
    res.status(201).json(funcionalidad);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/funcionalidades/:id/toggle
 * Activa o desactiva una funcionalidad.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function toggleActivo(req, res, next) {
  try {
    const { id } = req.params;
    const funcionalidad = await funcionalidadService.toggleActivo(id, req.user.userId);
    res.json({ ok: true, activo: funcionalidad.activo });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, toggleActivo };
