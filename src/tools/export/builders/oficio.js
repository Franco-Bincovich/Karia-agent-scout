// tools/export/builders/oficio.js
// Constructor de documento tipo Oficio formal.

const { AlignmentType } = require('docx');
const { parrafoTexto, parrafoLabel, separador, lineasContenido } = require('../helpers');

/**
 * Construye los párrafos de un oficio administrativo formal.
 *
 * @param {string} titulo - Asunto del oficio (usado si metadatos.asunto está vacío)
 * @param {string} contenido - Cuerpo del documento, párrafos separados por \n
 * @param {{ nroOficio?: string, destinatario?: string, cargo?: string, asunto?: string,
 *           firmante?: string, cargoFirmante?: string, organismo?: string, fecha?: string }} meta
 * @returns {import('docx').Paragraph[]}
 */
function buildOficio(titulo, contenido, meta) {
  const fechaDefault = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return [
    parrafoTexto(meta.organismo || '', { bold: true, alignment: AlignmentType.CENTER }),
    parrafoTexto(`Oficio N° ${meta.nroOficio || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 240,
    }),
    separador(),
    parrafoLabel('A', `${meta.destinatario || ''}${meta.cargo ? ` — ${meta.cargo}` : ''}`),
    parrafoLabel('Asunto', meta.asunto || titulo),
    parrafoLabel('Fecha', meta.fecha || fechaDefault),
    separador(),
    parrafoTexto('Tengo el agrado de dirigirme a Ud. a efectos de comunicarle:', {
      spacingAfter: 200,
    }),
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

module.exports = { buildOficio };
