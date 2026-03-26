// tools/export/builders/circular.js
// Constructor de documento tipo Circular.

const { AlignmentType } = require('docx');
const { parrafoTexto, parrafoLabel, separador, parrafoNumerado } = require('../helpers');

/**
 * Construye los párrafos de una circular numerada.
 *
 * @param {string} titulo - Referencia / asunto de la circular
 * @param {string} contenido - Ítems del comunicado, uno por línea
 * @param {{ nroCircular?: string, destinatario?: string, firmante?: string,
 *           cargoFirmante?: string, organismo?: string, fecha?: string }} meta
 * @returns {import('docx').Paragraph[]}
 */
function buildCircular(titulo, contenido, meta) {
  const fechaDefault = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const items = contenido.split('\n').filter((l) => l.trim() !== '');

  return [
    parrafoTexto(meta.organismo || '', { bold: true, alignment: AlignmentType.CENTER }),
    parrafoTexto(`Circular N° ${meta.nroCircular || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 240,
    }),
    separador(),
    parrafoLabel('A', meta.destinatario || 'TODO EL PERSONAL'),
    parrafoLabel('Ref.', titulo),
    parrafoLabel('Fecha', meta.fecha || fechaDefault),
    separador(),
    parrafoTexto('Por medio de la presente se comunica a todo el personal:', { spacingAfter: 200 }),
    ...items.map((item, i) => parrafoNumerado(item, i + 1)),
    parrafoTexto('', { spacingAfter: 300 }),
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

module.exports = { buildCircular };
