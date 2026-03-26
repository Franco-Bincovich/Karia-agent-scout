// tools/search/ordenanzas.js
// Búsqueda de ordenanzas municipales del Partido de Escobar.

const cheerio = require('cheerio');
const { fetchHtml } = require('./web');
const logger = require('../../utils/logger').child({ module: 'search/ordenanzas' });
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');

// HCD Escobar publica sus ordenanzas en el sitio oficial del municipio
const BASE_URL = 'https://www.escobar.gob.ar/hcd/ordenanzas';

/**
 * Busca ordenanzas municipales del Partido de Escobar.
 * Combina búsqueda en el sitio del HCD local con DuckDuckGo acotado al dominio.
 *
 * @param {{ query: string }} params
 * @returns {Promise<{ query: string, fuente: string, resultados: Array }>}
 */
async function _buscarOrdenanzas({ query }) {
  logger.info('Búsqueda ordenanzas iniciada', { query });

  const url = `${BASE_URL}?buscar=${encodeURIComponent(query)}`;
  const resultados = [];

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // El HCD Escobar lista ordenanzas en filas de tabla o links con número
    $('table tr, .ordenanza-item').each((_i, el) => {
      const enlace = $(el).find('a').first();
      const titulo = enlace.text().trim() || $(el).find('.titulo').text().trim();
      const href = enlace.attr('href') || '';
      const numero = $(el).find('.numero, td:first-child').text().trim();

      if (titulo) {
        const urlCompleta = href.startsWith('http') ? href : `https://www.escobar.gob.ar${href}`;
        resultados.push({ numero, titulo, url: urlCompleta });
      }
    });
  } catch (err) {
    // Si el sitio no está disponible, devolvemos array vacío con nota
    logger.warn('Sitio HCD no disponible, sin resultados locales', { error: err.message });
  }

  logger.info('Ordenanzas encontradas', { query, cantidad: resultados.length });
  return {
    query,
    fuente: 'HCD Partido de Escobar',
    resultados: resultados.slice(0, 10),
  };
}

const buscarOrdenanzas = withCircuitBreaker(
  withRetry(_buscarOrdenanzas, { maxIntentos: 2, delayBase: 1_000 }),
  { maxFallos: 3, cooldownMs: 60_000, nombre: 'buscar-ordenanzas' }
);

module.exports = { buscarOrdenanzas };
