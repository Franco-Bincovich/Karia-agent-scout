// tools/export/helpers.js
// Helpers de construcción de párrafos compartidos por todos los builders.

const { Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

function parrafoTexto(texto, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: texto, size: opts.size || 24, bold: opts.bold || false })],
    spacing: { after: opts.spacingAfter !== undefined ? opts.spacingAfter : 120 },
    alignment: opts.alignment || AlignmentType.LEFT,
  });
}

function parrafoTitulo(texto) {
  return new Paragraph({
    text: texto,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
    alignment: AlignmentType.CENTER,
  });
}

function parrafoLabel(label, valor) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 24 }),
      new TextRun({ text: valor || '', size: 24 }),
    ],
    spacing: { after: 80 },
  });
}

function separador() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    spacing: { after: 160 },
  });
}

function lineasContenido(contenido) {
  return contenido
    .split('\n')
    .filter((linea) => linea.trim() !== '')
    .map((linea) => parrafoTexto(linea));
}

function parrafoNumerado(texto, numero) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${numero}. `, bold: true, size: 24 }),
      new TextRun({ text: texto, size: 24 }),
    ],
    spacing: { after: 120 },
  });
}

function parrafoFirma(nombre) {
  return new Paragraph({
    children: [new TextRun({ text: `____________________________    ${nombre}`, size: 22 })],
    spacing: { after: 160 },
  });
}

module.exports = {
  parrafoTexto,
  parrafoTitulo,
  parrafoLabel,
  separador,
  lineasContenido,
  parrafoNumerado,
  parrafoFirma,
};
