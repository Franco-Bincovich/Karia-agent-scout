// tools/search/web.js
// Búsqueda web genérica: fetchHtml compartido, DuckDuckGo scraper y _buscarWeb.

const cheerio = require('cheerio');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger').child({ module: 'search/web' });
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');

const TIMEOUT_MS = 8_000;
const UA = 'KarIA-Escobar/1.0 (+https://karia.ar)';
const DDG_URL = 'https://html.duckduckgo.com/html/';

/**
 * Descarga el HTML de una URL con timeout y User-Agent institucional.
 *
 * @param {string} url - URL a descargar
 * @returns {Promise<string>} HTML de la respuesta
 * @throws {AppError} code: 'FETCH_ERROR'
 */
async function fetchHtml(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) {
      throw new AppError(`HTTP ${res.status} al obtener ${url}`, 'FETCH_ERROR', 502);
    }
    return await res.text();
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError(`Error al obtener ${url}: ${err.message}`, 'FETCH_ERROR', 502);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca en DuckDuckGo y devuelve los resultados como array.
 *
 * @param {string} query - Término de búsqueda
 * @param {number} max   - Máximo de resultados (default 5)
 * @returns {Promise<Array<{ titulo: string, url: string, fragmento: string }>>}
 */
async function buscarConClaude(query, max = 5) {
  const url = `${DDG_URL}?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const resultados = [];

  $('.result__body')
    .slice(0, max)
    .each((_i, el) => {
      const titulo = $(el).find('.result__title').text().trim();
      const fragmento = $(el).find('.result__snippet').text().trim();
      const href = $(el).find('a.result__url').attr('href') || '';
      if (titulo) resultados.push({ titulo, url: href, fragmento });
    });

  return resultados;
}

/**
 * Búsqueda web para el agente: busca en DuckDuckGo y loguea el request.
 *
 * @param {{ userId: string, query: string, maxResultados?: number }} params
 * @returns {Promise<{ query: string, resultados: Array }>}
 */
async function _buscarWeb({ userId, query, maxResultados = 5 }) {
  logger.info('Búsqueda web iniciada', { userId, query, maxResultados });
  const resultados = await buscarConClaude(query, Math.min(maxResultados, 10));
  logger.info('Búsqueda web completada', { userId, cantidad: resultados.length });
  return { query, resultados };
}

const buscarWeb = withCircuitBreaker(withRetry(_buscarWeb, { maxIntentos: 2, delayBase: 1_000 }), {
  maxFallos: 3,
  cooldownMs: 30_000,
  nombre: 'buscar-web',
});

module.exports = { fetchHtml, buscarConClaude, buscarWeb };
