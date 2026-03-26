// tools/excelAvanzado.js
// Análisis estadístico de archivos Excel cargados en /tmp.
// Lee todas las hojas y calcula stats por columna automáticamente.

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'excelAvanzado' });
const { TMP_DIR } = require('../utils/paths');
const { statsNumericas, masFrequentes } = require('../utils/stats');

// ── Análisis de una hoja ──────────────────────────────────────────────────────

/**
 * Analiza una hoja de Excel y devuelve estadísticas por columna.
 * La fila 1 se trata como encabezado. Detecta automáticamente si cada columna
 * es numérica (mayoría de valores parseables como Number) o de texto.
 *
 * @param {import('exceljs').Worksheet} worksheet - Hoja a analizar
 * @returns {{ nombre: string, filas: number, columnas: Array<{ nombre: string, estadisticas: Object }> }}
 */
function analizarHoja(worksheet) {
  const columnasData = new Map(); // colIdx → { nombre, numericos[], textos[], vacias }

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (!columnasData.has(colNumber)) {
        columnasData.set(colNumber, { nombre: '', numericos: [], textos: [], vacias: 0 });
      }
      const col = columnasData.get(colNumber);

      if (rowNumber === 1) {
        col.nombre = cell.text?.toString().trim() || `Col${colNumber}`;
        return;
      }

      const val = cell.value;
      if (val === null || val === undefined || val === '') {
        col.vacias++;
      } else if (
        typeof val === 'number' ||
        (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
      ) {
        col.numericos.push(typeof val === 'number' ? val : Number(val));
      } else {
        col.textos.push(val);
      }
    });
  });

  const totalFilas = Math.max(0, worksheet.rowCount - 1); // sin encabezado

  const columnas = [...columnasData.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, col]) => {
      const esNumerica = col.numericos.length > 0 && col.numericos.length >= col.textos.length;
      const estadisticas = esNumerica
        ? { tipo: 'numerico', vacias: col.vacias, ...statsNumericas(col.numericos) }
        : { tipo: 'texto', vacias: col.vacias, masFrequentes: masFrequentes(col.textos) };
      return { nombre: col.nombre, estadisticas };
    });

  return { nombre: worksheet.name, filas: totalFilas, columnas };
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Lee un archivo Excel de /tmp y devuelve análisis estadístico por hoja.
 *
 * @param {{ userId: string, nombreArchivo: string, instruccion?: string }} params
 * @returns {Promise<{ hojas: Object[], resumen_general: Object, instruccion?: string }>}
 * @throws {AppError} ARCHIVO_NO_ENCONTRADO | EXCEL_AVANZADO_ERROR
 */
async function analizarExcelAvanzado({ userId, nombreArchivo, instruccion }) {
  // Normalizar nombre: remover .xlsx si viene con extensión para armar ruta consistente
  const base = nombreArchivo.replace(/\.xlsx$/i, '');
  const rutaConExt = path.join(TMP_DIR, `${userId}_${base}.xlsx`);
  const rutaSinExt = path.join(TMP_DIR, `${userId}_${base}`);

  const ruta = fs.existsSync(rutaConExt)
    ? rutaConExt
    : fs.existsSync(rutaSinExt)
      ? rutaSinExt
      : null;

  if (!ruta) {
    throw new AppError(
      `No se encontró el archivo "${base}.xlsx". Subilo primero usando el botón de adjuntar.`,
      'ARCHIVO_NO_ENCONTRADO',
      404
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(ruta);

    const hojas = [];
    workbook.eachSheet((ws) => hojas.push(analizarHoja(ws)));

    const totalFilas = hojas.reduce((s, h) => s + h.filas, 0);
    const totalColumnas = hojas.reduce((s, h) => s + h.columnas.length, 0);

    logger.info('Excel analizado', { userId, archivo: base, hojas: hojas.length, totalFilas });

    return {
      hojas,
      resumen_general: {
        archivo: `${base}.xlsx`,
        totalHojas: hojas.length,
        totalFilas,
        totalColumnas,
        nombresHojas: hojas.map((h) => h.nombre),
      },
      ...(instruccion ? { instruccion } : {}),
    };
  } catch (err) {
    if (err.isOperational) throw err;
    logger.error('Error al analizar Excel', { error: err.message });
    throw new AppError(
      `Error al analizar el archivo Excel: ${err.message}`,
      'EXCEL_AVANZADO_ERROR',
      500
    );
  }
}

module.exports = { analizarExcelAvanzado };
