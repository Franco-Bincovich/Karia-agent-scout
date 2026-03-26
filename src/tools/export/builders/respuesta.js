// tools/export/builders/respuesta.js
// Constructor de documento tipo Nota de Respuesta.

const { AlignmentType } = require('docx');
const { parrafoTexto, parrafoLabel, separador, lineasContenido } = require('../helpers');

/**
 * Construye los párrafos de una nota de respuesta formal.
 *
 * @param {string} _titulo - No utilizado directamente (se usa meta.refDocumento como referencia)
 * @param {string} contenido - Cuerpo de la respuesta, párrafos separados por \n
 * @param {{ refDocumento?: string, nroExpediente?: string, destinatario?: string,
 *           firmante?: string, cargoFirmante?: string, organismo?: string, fecha?: string }} meta
 * @returns {import('docx').Paragraph[]}
 */
function buildRespuesta(_titulo, contenido, meta) {
  const fechaDefault = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return [
    parrafoTexto(meta.organismo || '', { bold: true, alignment: AlignmentType.CENTER }),
    parrafoTexto('NOTA DE RESPUESTA', {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 240,
    }),
    separador(),
    parrafoLabel('A', meta.destinatario || ''),
    parrafoLabel('En respuesta a', meta.refDocumento || ''),
    ...(meta.nroExpediente ? [parrafoLabel('Expediente', meta.nroExpediente)] : []),
    parrafoLabel('Fecha', meta.fecha || fechaDefault),
    separador(),
    ...lineasContenido(contenido),
    parrafoTexto('Sin otro particular, saludo a Ud. atentamente.', { spacingAfter: 400 }),
    parrafoTexto('____________________________', {
      alignment: AlignmentType.CENTER,
      spacingAfter: 40,
    }),
    parrafoTexto(meta.firmante || '', {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 40,
    }),
    parrafoTexto(meta.cargoFirmante || '', { alignment: AlignmentType.CENTER }),
  ];
}

module.exports = { buildRespuesta };
