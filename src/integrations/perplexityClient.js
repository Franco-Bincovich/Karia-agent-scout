// integrations/perplexityClient.js
// Cliente para la API de Perplexity (sonar) — búsqueda web con citaciones.
// Docs: https://docs.perplexity.ai/reference/post_chat_completions

const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'perplexityClient' });

const ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar';

/**
 * Busca en la web usando la API de Perplexity y devuelve resultados estructurados.
 *
 * @param {string} apiKey - API key de Perplexity (pplx-...)
 * @param {string} query  - Término de búsqueda
 * @param {number} [max=5] - Máximo de resultados a devolver
 * @returns {Promise<Array<{ titulo: string, url: string, resumen: string }>>}
 * @throws {AppError} PERPLEXITY_ERROR
 */
async function buscarPerplexity(apiKey, query, max = 5) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Sos un asistente de búsqueda. Respondé siempre en español argentino con información precisa y actualizada.',
        },
        { role: 'user', content: query },
      ],
      max_tokens: 1024,
      return_citations: true,
      return_images: false,
      search_recency_filter: 'month',
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn('Error Perplexity', { status: res.status, body });
    throw new AppError(`Error en Perplexity: HTTP ${res.status}`, 'PERPLEXITY_ERROR', 502);
  }

  const data = await res.json();
  const contenido = data.choices?.[0]?.message?.content || '';
  const citaciones = data.citations || [];

  // Construir resultados: una entrada por citación + el resumen del modelo
  if (citaciones.length > 0) {
    return citaciones.slice(0, max).map((url, i) => ({
      titulo: `Fuente ${i + 1}`,
      url,
      resumen: i === 0 ? contenido : '',
    }));
  }

  // Sin citaciones: devolver el texto completo como un único resultado
  return contenido ? [{ titulo: query, url: '', resumen: contenido }] : [];
}

module.exports = { buscarPerplexity };
