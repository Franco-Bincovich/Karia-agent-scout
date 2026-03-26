// routes/documentoRoutes.js
// Rutas para subida y parseo de documentos empresariales.

const express = require('express');
const multer = require('multer');
const os = require('os');
const path = require('path');
const { check } = require('express-validator');
const { verificarToken } = require('../middleware/auth');
const manejarErroresValidacion = require('../middleware/manejarErroresValidacion');
const { uploadRateLimiter } = require('../middleware/rateLimiters');
const { subirDocumento } = require('../controllers/documentoController');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

const EXTENSIONES_PERMITIDAS = new Set(['.pdf', '.xlsx', '.xls', '.docx', '.csv', '.txt']);

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (EXTENSIONES_PERMITIDAS.has(ext)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Extensión no permitida: ${ext}. Formatos válidos: PDF, Excel, Word, CSV, TXT.`,
          'TIPO_NO_SOPORTADO',
          415
        )
      );
    }
  },
});

// POST /api/documentos/upload
// El validator corre después de multer para que req.file esté disponible.
router.post(
  '/upload',
  verificarToken,
  uploadRateLimiter,
  upload.single('archivo'),
  [
    check('archivo').custom((_value, { req }) => {
      if (!req.file) {
        throw new AppError(
          'No se recibió ningún archivo. Enviá el campo "archivo" como multipart/form-data.',
          'ARCHIVO_REQUERIDO',
          400
        );
      }
      return true;
    }),
  ],
  manejarErroresValidacion,
  subirDocumento
);

module.exports = router;
