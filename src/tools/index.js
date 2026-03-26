// tools/index.js
// Registro central de herramientas del agente KarIA Escobar.
// TOOLS se pasa directamente a la API de Anthropic en agent.js.

const { AppError } = require('../middleware/errorHandler');
const { TOOLS } = require('./toolDefinitions');

// ── Tools locales (filesystem) ────────────────────────────────────────────────
const { generarExcel } = require('./excel');
const { generarWord } = require('./export');

// ── Tools de análisis (wrappers — Claude procesa el resultado) ────────────────
function analizarDocumento({ contenido, instruccion, formatoSalida = 'texto_libre' }) {
  return {
    tipo: 'analizar_documento',
    instruccion,
    formatoSalida,
    longitudContenido: contenido.length,
    contenido,
  };
}
function analizarExcelBasico({
  nombreHoja,
  datos,
  instruccion = 'Resumí los datos con totales, promedios y observaciones clave.',
}) {
  return {
    tipo: 'analizar_excel_basico',
    nombreHoja,
    instruccion,
    cantidadLineas: datos.split('\n').length,
    datos,
  };
}

// ── Excel avanzado ────────────────────────────────────────────────────────────
const { analizarExcelAvanzado } = require('./excelAvanzado');

// ── Gamma AI ─────────────────────────────────────────────────────────────────
const { generarPresentacion } = require('./gamma');

// ── Tools de búsqueda ────────────────────────────────────────────────────────
const { buscarWeb, buscarNormativa, buscarOrdenanzas } = require('./search');

// ── Tools Google Workspace ────────────────────────────────────────────────────
const { leerGmail, enviarGmail } = require('./google/gmail');
const { leerCalendar, crearEvento } = require('./google/calendar');
const { buscarDrive } = require('./google/drive');

// ── Sets de inyección de userId ───────────────────────────────────────────────
// FILE_TOOLS: generan archivos en disco — userId prefija el nombre (anti-IDOR)
const FILE_TOOLS = new Set(['generar_excel', 'generar_word']);

// USER_TOOLS: necesitan userId pero no generan archivos (Google + búsqueda + análisis)
const USER_TOOLS = new Set([
  'leer_gmail',
  'enviar_gmail',
  'leer_calendar',
  'crear_evento',
  'buscar_drive',
  'buscar_web',
  'generar_presentacion',
  'analizar_documento',
  'analizar_excel_basico',
  'analizar_excel_avanzado',
]);

// ── Mapa de despacho ──────────────────────────────────────────────────────────
const mapaTools = {
  generar_excel: generarExcel,
  generar_word: generarWord,
  analizar_documento: analizarDocumento,
  analizar_excel_basico: analizarExcelBasico,
  leer_gmail: leerGmail,
  enviar_gmail: enviarGmail,
  leer_calendar: leerCalendar,
  crear_evento: crearEvento,
  buscar_drive: buscarDrive,
  analizar_excel_avanzado: analizarExcelAvanzado,
  generar_presentacion: generarPresentacion,
  buscar_web: buscarWeb,
  buscar_normativa: buscarNormativa,
  buscar_ordenanzas: buscarOrdenanzas,
};

/**
 * Ejecuta una herramienta por nombre con los parámetros dados.
 *
 * @param {string} nombre - Nombre de la tool (debe coincidir con TOOLS[].name)
 * @param {Object} params - Parámetros de la tool
 * @param {string} userId - ID del usuario autenticado
 * @returns {Promise<any>}
 * @throws {AppError} code: 'TOOL_NOT_FOUND'
 */
async function ejecutarTool(nombre, params, userId) {
  const fn = mapaTools[nombre];
  if (!fn) throw new AppError(`Tool desconocida: ${nombre}`, 'TOOL_NOT_FOUND', 400);

  if (FILE_TOOLS.has(nombre)) return fn({ ...params, userId });
  if (USER_TOOLS.has(nombre)) return fn({ ...params, userId });
  return fn(params);
}

module.exports = { TOOLS, ejecutarTool };
