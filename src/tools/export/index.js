// tools/export/index.js
// Dispatcher: genera documentos Word según el tipo formal solicitado.
// Delega la construcción de párrafos al builder correspondiente.

const path = require('path');
const fs = require('fs');
const { Document, Packer } = require('docx');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'export' });
const { TMP_DIR } = require('../../utils/paths');
const { buildOficio } = require('./builders/oficio');
const { buildCircular } = require('./builders/circular');
const { buildActa } = require('./builders/acta');
const { buildRespuesta } = require('./builders/respuesta');
const { buildGeneral } = require('./builders/general');

const BUILDERS = {
  oficio: buildOficio,
  circular: buildCircular,
  acta: buildActa,
  respuesta: buildRespuesta,
  general: buildGeneral,
};

/**
 * Genera un documento Word (.docx) con formato según el tipo de documento.
 *
 * @param {{
 *   nombreArchivo: string,
 *   userId: string,
 *   titulo: string,
 *   contenido: string,
 *   tipoDocumento?: 'oficio'|'circular'|'acta'|'respuesta'|'general',
 *   metadatos?: Object
 * }} params
 * @returns {Promise<string>} ruta local del archivo generado en /tmp
 * @throws {AppError} code: 'EXPORT_ERROR'
 */
async function generarWord({
  nombreArchivo,
  userId,
  titulo,
  contenido,
  tipoDocumento = 'general',
  metadatos = {},
}) {
  try {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

    const builder = BUILDERS[tipoDocumento] || BUILDERS.general;
    const children = builder(titulo, contenido, metadatos);

    const doc = new Document({
      sections: [
        {
          properties: { page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } } },
          children,
        },
      ],
    });

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.docx`);
    fs.writeFileSync(rutaArchivo, await Packer.toBuffer(doc));

    logger.info('Word generado', { rutaArchivo, tipo: tipoDocumento });
    return rutaArchivo;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al generar Word', { error: err.message });
    throw new AppError(`Error al generar Word: ${err.message}`, 'EXPORT_ERROR', 500);
  }
}

module.exports = { generarWord };
