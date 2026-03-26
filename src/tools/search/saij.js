// tools/search/saij.js
// Scraper de SAIJ — Sistema Argentino de Información Jurídica.

const cheerio = require('cheerio');
const { fetchHtml } = require('./web');
const logger = require('../../utils/logger').child({ module: 'search/saij' });

const BASE_URL = 'https://www.saij.gob.ar/busqueda-de-normas';

/**
 * Busca normativa en SAIJ y devuelve los resultados encontrados.
 *
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array<{ titulo: string, url: string, tipo: string, fecha: string }>>}
 */
async function scrapeSAIJ(query) {
  const params = new URLSearchParams({ p: query });
  const url = `${BASE_URL}?${params.toString()}`;
  logger.debug('Consultando SAIJ', { url });

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const resultados = [];

  // SAIJ usa article.resultado o li.resultado según la versión
  $('article.resultado, li.resultado').each((_i, el) => {
    const enlace = $(el).find('a.titulo-norma, h3 a').first();
    const titulo = enlace.text().trim();
    const href = enlace.attr('href') || '';
    const tipo = $(el).find('.tipo-norma').text().trim() || 'Normativa';
    const fecha = $(el).find('.fecha').text().trim();

    if (titulo) {
      const urlCompleta = href.startsWith('http') ? href : `https://www.saij.gob.ar${href}`;
      resultados.push({ titulo, url: urlCompleta, tipo, fecha });
    }
  });

  // Fallback: links que contienen /detalle-norma/
  if (resultados.length === 0) {
    $('a[href*="/detalle-norma/"]').each((_i, el) => {
      const titulo = $(el).text().trim();
      const href = $(el).attr('href') || '';
      if (titulo && href) {
        const urlCompleta = href.startsWith('http') ? href : `https://www.saij.gob.ar${href}`;
        resultados.push({ titulo, url: urlCompleta, tipo: 'Normativa', fecha: '' });
      }
    });
  }

  logger.info('SAIJ resultados', { query, cantidad: resultados.length });
  return resultados.slice(0, 10);
}

module.exports = { scrapeSAIJ };
