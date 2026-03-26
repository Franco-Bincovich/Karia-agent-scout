// tools/export/builders/acta.js
// Constructor de documento tipo Acta de Reunión.

const { AlignmentType } = require('docx');
const {
  parrafoTexto,
  parrafoLabel,
  separador,
  lineasContenido,
  parrafoFirma,
} = require('../helpers');

/**
 * Construye los párrafos de un acta de reunión formal.
 *
 * @param {string} _titulo - No utilizado en acta (el encabezado es fijo)
 * @param {string} contenido - Desarrollo de la reunión, párrafos separados por \n
 * @param {{ nroActa?: string, lugar?: string, presentes?: string[]|string,
 *           ordenDia?: string[]|string, cierre?: string, fecha?: string }} meta
 * @returns {import('docx').Paragraph[]}
 */
function buildActa(_titulo, contenido, meta) {
  const fechaDefault = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const presentes = Array.isArray(meta.presentes)
    ? meta.presentes
    : (meta.presentes || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const ordenDia = Array.isArray(meta.ordenDia)
    ? meta.ordenDia
    : (meta.ordenDia || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  return [
    parrafoTexto('ACTA DE REUNIÓN', { bold: true, alignment: AlignmentType.CENTER, size: 28 }),
    parrafoTexto(`N° ${meta.nroActa || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 200,
    }),
    separador(),
    parrafoLabel('Fecha', meta.fecha || fechaDefault),
    parrafoLabel('Lugar', meta.lugar || ''),
    parrafoTexto(''),
    parrafoTexto('PRESENTES:', { bold: true, spacingAfter: 80 }),
    ...presentes.map((p) => parrafoTexto(`• ${p}`, { spacingAfter: 60 })),
    parrafoTexto(''),
    parrafoTexto('ORDEN DEL DÍA:', { bold: true, spacingAfter: 80 }),
    ...ordenDia.map((o, i) => parrafoTexto(`${i + 1}. ${o}`, { spacingAfter: 60 })),
    separador(),
    parrafoTexto('DESARROLLO:', { bold: true, spacingAfter: 120 }),
    ...lineasContenido(contenido),
    separador(),
    parrafoTexto('CIERRE:', { bold: true, spacingAfter: 80 }),
    parrafoTexto(meta.cierre || 'Siendo las ___ horas, se da por finalizada la reunión.', {
      spacingAfter: 300,
    }),
    parrafoTexto('Firmas de los presentes:', { bold: true, spacingAfter: 200 }),
    ...presentes.map((p) => parrafoFirma(p)),
  ];
}

module.exports = { buildActa };
