// tools/search/infoleg.js
// Scraper de Infoleg — base de datos de normativa nacional argentina.

const cheerio = require('cheerio');
const { fetchHtml } = require('./web');
const logger = require('../../utils/logger').child({ module: 'search/infoleg' });

const BASE_URL = 'https://www.infoleg.gob.ar/infolegInternet/buscarNormas.do';

/**
 * Busca normativa en Infoleg y devuelve los resultados encontrados.
 *
 * @param {string} query      - Término de búsqueda
 * @param {string} [organismo] - Filtro opcional por organismo emisor
 * @returns {Promise<Array<{ titulo: string, url: string, tipo: string, fecha: string }>>}
 */
async function scrapeInfoleg(query, organismo) {
  const params = new URLSearchParams({ palabraContenida: query });
  if (organismo) params.set('idOrganismo', organismo);

  const url = `${BASE_URL}?${params.toString()}`;
  logger.debug('Consultando Infoleg', { url });

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const resultados = [];

  // La tabla de resultados usa class="tablaDatos" en Infoleg
  $('table.tablaDatos tr')
    .slice(1)
    .each((_i, fila) => {
      const celdas = $(fila).find('td');
      if (celdas.length < 3) return;

      const enlace = $(celdas[1]).find('a');
      const titulo = enlace.text().trim();
      const href = enlace.attr('href') || '';
      const tipo = $(celdas[0]).text().trim();
      const fecha = $(celdas[2]).text().trim();

      if (titulo) {
        const urlCompleta = href.startsWith('http') ? href : `https://www.infoleg.gob.ar${href}`;
        resultados.push({ titulo, url: urlCompleta, tipo, fecha });
      }
    });

  // Fallback: si no encontró filas con tablaDatos, buscar links con texto
  if (resultados.length === 0) {
    $('a[href*="infolegInternet/anexos"]').each((_i, el) => {
      const titulo = $(el).text().trim();
      const href = $(el).attr('href') || '';
      if (titulo && href) {
        const urlCompleta = href.startsWith('http') ? href : `https://www.infoleg.gob.ar${href}`;
        resultados.push({ titulo, url: urlCompleta, tipo: 'Normativa', fecha: '' });
      }
    });
  }

  logger.info('Infoleg resultados', { query, cantidad: resultados.length });
  return resultados.slice(0, 10);
}

module.exports = { scrapeInfoleg };
