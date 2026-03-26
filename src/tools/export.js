// tools/export.js
// Generación de documentos Word (.docx) usando la librería docx.
// Soporta tipos formales: oficio, circular, acta, respuesta, general.

const path = require('path');
const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} = require('docx');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'export' });
const { TMP_DIR } = require('../utils/paths');

const TIPOS_VALIDOS = ['oficio', 'circular', 'acta', 'respuesta', 'general'];

// ── Helpers de párrafos ──────────────────────────────────────────────────────

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
    .filter((l) => l.trim() !== '')
    .map((l) => parrafoTexto(l));
}

// ── Constructores por tipo ────────────────────────────────────────────────────

/**
 * Oficio: número, destinatario, asunto, cuerpo, firma.
 * Params esperados en metadatos: nroOficio, destinatario, cargo, asunto, firmante, cargoFirmante
 */
function buildOficio(titulo, contenido, meta) {
  const children = [
    parrafoTexto(meta.organismo || '', { bold: true, alignment: AlignmentType.CENTER }),
    parrafoTexto(`Oficio N° ${meta.nroOficio || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 240,
    }),
    separador(),
    parrafoLabel('A', `${meta.destinatario || ''}${meta.cargo ? ` — ${meta.cargo}` : ''}`),
    parrafoLabel('Asunto', meta.asunto || titulo),
    parrafoLabel(
      'Fecha',
      meta.fecha ||
        new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    ),
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
  return children;
}

/**
 * Circular: número, destinatario general, cuerpo numerado, firma.
 * Params: nroCircular, destinatario, firmante, cargoFirmante
 */
function buildCircular(titulo, contenido, meta) {
  const items = contenido.split('\n').filter((l) => l.trim() !== '');
  const children = [
    parrafoTexto(meta.organismo || '', { bold: true, alignment: AlignmentType.CENTER }),
    parrafoTexto(`Circular N° ${meta.nroCircular || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 240,
    }),
    separador(),
    parrafoLabel('A', meta.destinatario || 'TODO EL PERSONAL'),
    parrafoLabel('Ref.', titulo),
    parrafoLabel(
      'Fecha',
      meta.fecha ||
        new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    ),
    separador(),
    parrafoTexto('Por medio de la presente se comunica a todo el personal:', { spacingAfter: 200 }),
    ...items.map(
      (item, i) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 24 }),
            new TextRun({ text: item, size: 24 }),
          ],
          spacing: { after: 120 },
        })
    ),
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
  return children;
}

/**
 * Acta: número, fecha, lugar, presentes, orden del día, desarrollo, cierre.
 * Params: nroActa, lugar, presentes (array o string), ordenDia (array o string), cierre
 */
function buildActa(titulo, contenido, meta) {
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

  const children = [
    parrafoTexto('ACTA DE REUNIÓN', { bold: true, alignment: AlignmentType.CENTER, size: 28 }),
    parrafoTexto(`N° ${meta.nroActa || '___/____'}`, {
      bold: true,
      alignment: AlignmentType.CENTER,
      spacingAfter: 200,
    }),
    separador(),
    parrafoLabel(
      'Fecha',
      meta.fecha ||
        new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    ),
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
    ...presentes.map(
      (p) =>
        new Paragraph({
          children: [new TextRun({ text: `____________________________    ${p}`, size: 22 })],
          spacing: { after: 160 },
        })
    ),
  ];
  return children;
}

/**
 * Respuesta: referencia al documento original, cuerpo, firma.
 * Params: refDocumento, nroExpediente, destinatario, firmante, cargoFirmante
 */
function buildRespuesta(titulo, contenido, meta) {
  const children = [
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
    parrafoLabel(
      'Fecha',
      meta.fecha ||
        new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    ),
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
  return children;
}

/**
 * General: formato original — título H1 + párrafos de texto plano.
 */
function buildGeneral(titulo, contenido) {
  return [parrafoTitulo(titulo), ...lineasContenido(contenido)];
}

// ── Función principal ─────────────────────────────────────────────────────────

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
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const tipo = TIPOS_VALIDOS.includes(tipoDocumento) ? tipoDocumento : 'general';

    let children;
    switch (tipo) {
      case 'oficio':
        children = buildOficio(titulo, contenido, metadatos);
        break;
      case 'circular':
        children = buildCircular(titulo, contenido, metadatos);
        break;
      case 'acta':
        children = buildActa(titulo, contenido, metadatos);
        break;
      case 'respuesta':
        children = buildRespuesta(titulo, contenido, metadatos);
        break;
      default:
        children = buildGeneral(titulo, contenido);
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
            },
          },
          children,
        },
      ],
    });

    const rutaArchivo = path.join(TMP_DIR, `${userId}_${nombreArchivo}.docx`);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(rutaArchivo, buffer);

    logger.info('Word generado', { rutaArchivo, tipo });
    return rutaArchivo;
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al generar Word', { error: err.message });
    throw new AppError(`Error al generar Word: ${err.message}`, 'EXPORT_ERROR', 500);
  }
}

module.exports = { generarWord };
