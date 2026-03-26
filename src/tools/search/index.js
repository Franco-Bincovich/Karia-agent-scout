// tools/search/index.js
// Punto de entrada del módulo de búsqueda.
// Ensambla buscarNormativa (Infoleg + SAIJ) y re-exporta todas las tools.

const logger = require('../../utils/logger').child({ module: 'search/index' });
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');
const { buscarWeb } = require('./web');
const { scrapeInfoleg } = require('./infoleg');
const { scrapeSAIJ } = require('./saij');
const { buscarOrdenanzas } = require('./ordenanzas');

/**
 * Busca normativa combinando Infoleg y SAIJ en paralelo.
 * Devuelve hasta 10 resultados de cada fuente.
 *
 * @param {{ query: string, organismo?: string }} params
 * @returns {Promise<{ query: string, infoleg: Array, saij: Array }>}
 */
async function _buscarNormativa({ query, organismo }) {
  logger.info('Búsqueda normativa iniciada', { query, organismo });

  const [resInfoleg, resSaij] = await Promise.allSettled([
    scrapeInfoleg(query, organismo),
    scrapeSAIJ(query),
  ]);

  if (resInfoleg.status === 'rejected') {
    logger.warn('Infoleg falló', { error: resInfoleg.reason?.message });
  }
  if (resSaij.status === 'rejected') {
    logger.warn('SAIJ falló', { error: resSaij.reason?.message });
  }

  const infoleg = resInfoleg.status === 'fulfilled' ? resInfoleg.value : [];
  const saij = resSaij.status === 'fulfilled' ? resSaij.value : [];

  logger.info('Normativa encontrada', { query, infoleg: infoleg.length, saij: saij.length });
  return { query, infoleg, saij };
}

const buscarNormativa = withCircuitBreaker(
  withRetry(_buscarNormativa, { maxIntentos: 2, delayBase: 1_000 }),
  { maxFallos: 3, cooldownMs: 60_000, nombre: 'buscar-normativa' }
);

module.exports = { buscarWeb, buscarNormativa, buscarOrdenanzas };
