// controllers/documentoController.js
// Orquesta la subida y parseo de documentos.

const fs = require('fs');
const { AppError } = require('../middleware/errorHandler');
const { parsearDocumento } = require('../services/documentoService');
const logger = require('../utils/logger').child({ module: 'documentoController' });

/**
 * POST /api/documentos/upload
 * Recibe un archivo vía multer, lo parsea y devuelve su texto.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function subirDocumento(req, res, next) {
  const archivo = req.file;

  if (!archivo) {
    return next(new AppError('No se recibió ningún archivo.', 'ARCHIVO_REQUERIDO', 400));
  }

  try {
    const { texto, tipo, truncado } = await parsearDocumento(archivo.path, archivo.originalname);

    res.json({
      nombreArchivo: archivo.originalname,
      tipo,
      truncado,
      texto,
    });
  } catch (err) {
    next(err);
  } finally {
    // Eliminar archivo temporal independientemente del resultado
    if (archivo && fs.existsSync(archivo.path)) {
      fs.unlink(archivo.path, (unlinkErr) => {
        if (unlinkErr) {
          logger.warn('No se pudo borrar el archivo temporal', {
            path: archivo.path,
            error: unlinkErr.message,
          });
        }
      });
    }
  }
}

module.exports = { subirDocumento };
