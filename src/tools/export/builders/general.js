// tools/export/builders/general.js
// Constructor de documento de formato libre (fallback).

const { parrafoTitulo, lineasContenido } = require('../helpers');

/**
 * Construye los párrafos de un documento de formato libre.
 * Título H1 centrado seguido del contenido como párrafos planos.
 *
 * @param {string} titulo - Título del documento
 * @param {string} contenido - Cuerpo del documento, párrafos separados por \n
 * @returns {import('docx').Paragraph[]}
 */
function buildGeneral(titulo, contenido) {
  return [parrafoTitulo(titulo), ...lineasContenido(contenido)];
}

module.exports = { buildGeneral };
