// tools/google/drive.js
// Herramienta Drive: búsqueda de archivos por nombre o contenido.

const { google } = require('googleapis');
const { getGoogleClient } = require('../../integrations/googleClient');
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');
const logger = require('../../utils/logger').child({ module: 'drive' });

const soloTransitorios = (err) => !err.isOperational && (!err.code || err.code >= 500);

// Tabla de tipos MIME legibles para mostrar al usuario
const MIME_LABELS = {
  'application/vnd.google-apps.document': 'Google Doc',
  'application/vnd.google-apps.spreadsheet': 'Google Sheets',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/vnd.google-apps.folder': 'Carpeta',
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
};

/**
 * Busca archivos en Google Drive del usuario por nombre o contenido.
 *
 * @param {{ userId: string, query: string }} params
 * @returns {Promise<Array<{ nombre, tipo, url, modificado }>>}
 */
async function _buscarDrive({ userId, query }) {
  const auth = await getGoogleClient(userId, 'drive');
  const drive = google.drive({ version: 'v3', auth });

  const termino = query.replace(/'/g, "\\'");
  const q = `(name contains '${termino}' or fullText contains '${termino}') and trashed = false`;

  const res = await drive.files.list({
    q,
    pageSize: 10,
    fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  const archivos = res.data.files || [];
  logger.info('Búsqueda Drive', { userId, query, resultados: archivos.length });

  return archivos.map((archivo) => ({
    nombre: archivo.name,
    tipo: MIME_LABELS[archivo.mimeType] || archivo.mimeType,
    url: archivo.webViewLink || '',
    modificado: archivo.modifiedTime
      ? new Date(archivo.modifiedTime).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '',
  }));
}

// ── Export con resilencia ────────────────────────────────────────────────────

const cbOpts = { maxFallos: 3, cooldownMs: 20_000 };
const retOpts = { maxIntentos: 2, delayBase: 1_000, shouldRetry: soloTransitorios };

const buscarDrive = withCircuitBreaker(withRetry(_buscarDrive, retOpts), {
  ...cbOpts,
  nombre: 'drive-buscar',
});

module.exports = { buscarDrive };
