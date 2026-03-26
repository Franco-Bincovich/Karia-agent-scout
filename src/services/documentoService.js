// services/documentoService.js
// Parsea archivos subidos y devuelve su contenido como texto plano.

const fs = require('fs');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'documentoService' });

const LIMITE_CHARS = 80000;

const TIPOS_SOPORTADOS = {
  '.pdf': 'pdf',
  '.xlsx': 'excel',
  '.xls': 'excel',
  '.docx': 'word',
  '.csv': 'csv',
  '.txt': 'txt',
};

/**
 * Trunca el texto si supera el límite y agrega aviso.
 *
 * @param {string} texto
 * @returns {{ texto: string, truncado: boolean }}
 */
function aplicarLimite(texto) {
  if (texto.length <= LIMITE_CHARS) return { texto, truncado: false };
  const truncado = texto.slice(0, LIMITE_CHARS);
  return {
    texto:
      truncado +
      '\n\n[AVISO: El documento fue truncado a 80.000 caracteres por exceder el límite permitido.]',
    truncado: true,
  };
}

/**
 * Parsea un PDF y devuelve su texto.
 *
 * @param {string} rutaArchivo
 * @returns {Promise<string>}
 */
async function parsearPDF(rutaArchivo) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(rutaArchivo);
  const resultado = await pdfParse(buffer);
  return resultado.text;
}

/**
 * Parsea un Excel (.xlsx/.xls) y devuelve su texto tabulado.
 *
 * @param {string} rutaArchivo
 * @returns {Promise<string>}
 */
async function parsearExcel(rutaArchivo) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(rutaArchivo);

  const lineas = [];
  workbook.eachSheet((sheet) => {
    lineas.push(`=== Hoja: ${sheet.name} ===`);
    sheet.eachRow((row) => {
      const valores = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        valores.push(cell.text ?? '');
      });
      lineas.push(valores.join('\t'));
    });
  });
  return lineas.join('\n');
}

/**
 * Parsea un Word (.docx) y devuelve su texto plano.
 *
 * @param {string} rutaArchivo
 * @returns {Promise<string>}
 */
async function parsearWord(rutaArchivo) {
  const mammoth = require('mammoth');
  const resultado = await mammoth.extractRawText({ path: rutaArchivo });
  return resultado.value;
}

/**
 * Parsea un CSV y devuelve su contenido como texto.
 *
 * @param {string} rutaArchivo
 * @returns {string}
 */
function parsearCSV(rutaArchivo) {
  return fs.readFileSync(rutaArchivo, 'utf8');
}

/**
 * Lee un archivo TXT y devuelve su contenido.
 *
 * @param {string} rutaArchivo
 * @returns {string}
 */
function parsearTXT(rutaArchivo) {
  return fs.readFileSync(rutaArchivo, 'utf8');
}

/**
 * Parsea un documento según su extensión y devuelve su texto.
 *
 * @param {string} rutaArchivo - Ruta absoluta al archivo temporal
 * @param {string} nombreOriginal - Nombre original del archivo (para detectar extensión)
 * @returns {Promise<{ texto: string, tipo: string, truncado: boolean }>}
 * @throws {AppError} code: 'TIPO_NO_SOPORTADO' | 'PARSE_ERROR'
 */
async function parsearDocumento(rutaArchivo, nombreOriginal) {
  const ext = path.extname(nombreOriginal).toLowerCase();
  const tipo = TIPOS_SOPORTADOS[ext];

  if (!tipo) {
    throw new AppError(
      `Tipo de archivo no soportado: ${ext}. Formatos válidos: PDF, Excel, Word, CSV, TXT.`,
      'TIPO_NO_SOPORTADO',
      415
    );
  }

  try {
    let textoRaw;

    if (tipo === 'pdf') textoRaw = await parsearPDF(rutaArchivo);
    else if (tipo === 'excel') textoRaw = await parsearExcel(rutaArchivo);
    else if (tipo === 'word') textoRaw = await parsearWord(rutaArchivo);
    else if (tipo === 'csv') textoRaw = parsearCSV(rutaArchivo);
    else textoRaw = parsearTXT(rutaArchivo);

    logger.info('Documento parseado', { nombreOriginal, tipo, chars: textoRaw.length });

    const { texto, truncado } = aplicarLimite(textoRaw);
    return { texto, tipo, truncado };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al parsear documento', { nombreOriginal, error: err.message });
    throw new AppError(`No se pudo procesar el archivo: ${err.message}`, 'PARSE_ERROR', 422);
  }
}

module.exports = { parsearDocumento };
