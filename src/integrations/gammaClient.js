// integrations/gammaClient.js
// Cliente para la API de Gamma AI — generación de presentaciones, documentos y páginas web.
// Docs: https://gamma.app/docs/api

const { AppError } = require('../middleware/errorHandler');
const config = require('../config');
const logger = require('../utils/logger').child({ module: 'gammaClient' });

const FORMATO_MAP = {
  presentacion: 'presentation',
  documento: 'document',
  pagina_web: 'webpage',
};

/**
 * Genera una presentación, documento o página web usando la API de Gamma AI.
 *
 * @param {string} apiKey - API key de Gamma (gamma-api-key-...)
 * @param {{ titulo: string, contenido: string, formato?: string }} params
 * @returns {Promise<{ url: string, titulo: string }>}
 * @throws {AppError} GAMMA_API_ERROR | GAMMA_INVALID_RESPONSE
 */
async function generarPresentacionGamma(apiKey, { titulo, contenido, formato = 'presentacion' }) {
  const tipo = FORMATO_MAP[formato] || 'presentation';

  const res = await fetch(config.gamma.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      title: titulo,
      content: contenido,
      format: tipo,
      theme: 'default',
      language: 'es',
    }),
    signal: AbortSignal.timeout(60_000), // Gamma puede tardar hasta 60s
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn('Error Gamma API', { status: res.status, body: body.slice(0, 200) });
    throw new AppError(`Error al generar en Gamma: HTTP ${res.status}`, 'GAMMA_API_ERROR', 502);
  }

  const data = await res.json();

  // Gamma devuelve la URL del contenido generado
  const url = data.url || data.link || data.result?.url || data.data?.url || '';
  if (!url) {
    logger.warn('Gamma no devolvió URL', { data });
    throw new AppError(
      'Gamma generó el contenido pero no devolvió una URL válida',
      'GAMMA_INVALID_RESPONSE',
      502
    );
  }

  logger.info('Presentación Gamma generada', { titulo, formato: tipo, url });
  return { url, titulo };
}

module.exports = { generarPresentacionGamma };
