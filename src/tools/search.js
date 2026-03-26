// tools/search.js
// Búsqueda web, normativa argentina y ordenanzas HCD Escobar.

const Anthropic = require('@anthropic-ai/sdk');
const { load } = require('cheerio');
const config = require('../config');
const integracionService = require('../services/integracionService');
const { buscarPerplexity } = require('../integrations/perplexityClient');
const { withCircuitBreaker } = require('../utils/circuitBreaker');
const { withRetry } = require('../utils/reintentos');
const logger = require('../utils/logger').child({ module: 'search' });

const soloTransitorios = (err) => !err.isOperational;
const cbOpts = { maxFallos: 4, cooldownMs: 30_000 };
const retOpts = { maxIntentos: 2, delayBase: 1_000, shouldRetry: soloTransitorios };

const anthropicClient = new Anthropic({ apiKey: config.anthropic.apiKey });

// ── Helpers de fetch con timeout ──────────────────────────────────────────────

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KarIA-Escobar/1.0 (+https://escobar.gob.ar)' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

// ── Fallback: Claude haiku con web_search ─────────────────────────────────────

async function buscarConClaude(query, max) {
  const resp = await anthropicClient.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [
      {
        role: 'user',
        content: `Buscá en internet sobre: ${query}. Incluí fuentes con título y URL.`,
      },
    ],
  });

  const texto = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  // Extraer URLs del texto (patrón básico)
  const urlRegex = /https?:\/\/[^\s)>\]"]+/g;
  const urls = [...new Set(texto.match(urlRegex) || [])].slice(0, max);

  if (urls.length > 0) {
    return urls
      .map((url) => ({ titulo: url, url, resumen: '' }))
      .concat([{ titulo: `Resumen: ${query}`, url: '', resumen: texto }])
      .slice(0, max);
  }

  return [{ titulo: query, url: '', resumen: texto }];
}

// ── buscarWeb ─────────────────────────────────────────────────────────────────

/**
 * Búsqueda web general. Usa Perplexity si está conectado, sino Claude web_search.
 *
 * @param {{ userId: string, query: string, maxResultados?: number }} params
 * @returns {Promise<Array<{ titulo, url, resumen }>>}
 */
async function _buscarWeb({ userId, query, maxResultados = 5 }) {
  const max = Math.min(maxResultados, 10);

  // Intentar con Perplexity si el usuario tiene la integración
  try {
    const creds = await integracionService.getCredenciales(userId, 'perplexity');
    const results = await buscarPerplexity(creds.api_key, query, max);
    logger.info('Búsqueda web via Perplexity', { userId, query });
    return results;
  } catch (err) {
    if (err.code !== 'INTEGRACION_NOT_FOUND' && err.code !== 'INTEGRACION_INACTIVA') {
      logger.warn('Perplexity falló, usando fallback Claude', { error: err.message });
    }
  }

  // Fallback: Claude con web_search
  logger.info('Búsqueda web via Claude haiku', { userId, query });
  return buscarConClaude(query, max);
}

// ── buscarNormativa ───────────────────────────────────────────────────────────

async function scrapeInfoleg(query) {
  const url = `https://servicios.infoleg.gob.ar/infolegInternet/buscar.do?s=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = load(html);
  const resultados = [];

  // Infoleg usa tabla con clase "tabla-resultado" o filas con datos de normas
  $('table tr').each((_, fila) => {
    const celdas = $(fila).find('td');
    if (celdas.length < 3) return;
    const enlace = $(celdas[0]).find('a');
    const titulo = enlace.text().trim() || $(celdas[0]).text().trim();
    const href = enlace.attr('href') || '';
    if (!titulo) return;
    resultados.push({
      titulo,
      organismo: $(celdas[1]).text().trim() || 'Infoleg',
      fecha: $(celdas[2]).text().trim() || '',
      url: href.startsWith('http') ? href : `https://servicios.infoleg.gob.ar${href}`,
    });
  });

  return resultados.slice(0, 8);
}

async function scrapeSAIJ(query) {
  const url = `https://www.saij.gob.ar/busqueda?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const $ = load(html);
  const resultados = [];

  // SAIJ usa divs con clase "resultado" o "documento"
  $('.resultado, .documento, [class*="resultado"]').each((_, el) => {
    const enlace = $(el).find('a').first();
    const titulo = enlace.text().trim() || $(el).find('h3, h4, strong').first().text().trim();
    const href = enlace.attr('href') || '';
    const meta = $(el).find('.fecha, [class*="fecha"], time').first().text().trim();
    if (!titulo) return;
    resultados.push({
      titulo,
      organismo: 'SAIJ',
      fecha: meta,
      url: href.startsWith('http') ? href : `https://www.saij.gob.ar${href}`,
    });
  });

  return resultados.slice(0, 8);
}

/**
 * Busca normativa en Infoleg y/o SAIJ.
 *
 * @param {{ query: string, organismo?: 'infoleg'|'saij'|'ambos' }} params
 * @returns {Promise<Array<{ titulo, organismo, fecha, url }>>}
 */
async function _buscarNormativa({ query, organismo = 'ambos' }) {
  const tareas = [];
  if (organismo === 'infoleg' || organismo === 'ambos')
    tareas.push(scrapeInfoleg(query).catch(() => []));
  if (organismo === 'saij' || organismo === 'ambos') tareas.push(scrapeSAIJ(query).catch(() => []));

  const partes = await Promise.all(tareas);
  return partes.flat();
}

// ── buscarOrdenanzas ──────────────────────────────────────────────────────────

/**
 * Busca ordenanzas en el HCD de Escobar.
 *
 * @param {{ query: string }} params
 * @returns {Promise<Array<{ numero, titulo, fecha, url }>>}
 */
async function _buscarOrdenanzas({ query }) {
  const base = 'https://hcdescobar.gob.ar';
  const url = `${base}/busqueda?q=${encodeURIComponent(query)}`;
  let html;
  try {
    html = await fetchHtml(url);
  } catch (_) {
    // Fallback: búsqueda en la página de ordenanzas
    html = await fetchHtml(`${base}/ordenanzas?buscar=${encodeURIComponent(query)}`);
  }

  const $ = load(html);
  const resultados = [];

  $('table tr, .ordenanza, [class*="ordenanza"], [class*="resultado"]').each((_, el) => {
    const enlace = $(el).find('a').first();
    const texto = enlace.text().trim() || $(el).text().trim();
    const href = enlace.attr('href') || '';
    if (!texto || texto.length < 4) return;

    // Intentar extraer número de ordenanza del texto
    const matchNro = texto.match(/\d{1,5}[\/-]\d{2,4}/);
    resultados.push({
      numero: matchNro ? matchNro[0] : '',
      titulo: texto,
      fecha: $(el).find('[class*="fecha"], time').first().text().trim() || '',
      url: href.startsWith('http') ? href : href ? `${base}${href}` : url,
    });
  });

  logger.info('Búsqueda ordenanzas HCD Escobar', { query, resultados: resultados.length });
  return resultados.slice(0, 10);
}

// ── Export con resilencia ────────────────────────────────────────────────────

const buscarWeb = withCircuitBreaker(withRetry(_buscarWeb, retOpts), {
  ...cbOpts,
  nombre: 'buscar-web',
});
const buscarNormativa = withCircuitBreaker(withRetry(_buscarNormativa, retOpts), {
  ...cbOpts,
  nombre: 'buscar-normativa',
});
const buscarOrdenanzas = withCircuitBreaker(withRetry(_buscarOrdenanzas, retOpts), {
  ...cbOpts,
  nombre: 'buscar-ordenanzas',
});

module.exports = { buscarWeb, buscarNormativa, buscarOrdenanzas };
