// utils/agentLoop.js
// Loop agentico de Claude: gestiona iteraciones, tool_use y end_turn.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'agentLoop' });
const { ejecutarTool } = require('../tools');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });
const MAX_ITERACIONES = 10;

function extraerTexto(contenido) {
  return contenido
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Ejecuta el loop agentico con soporte de herramientas.
 *
 * @param {{ messages: Object[], systemPrompt: string, tools: Object[], userId: string }} params
 * @returns {Promise<{ respuesta: string, mensajesActualizados: Object[] }>}
 * @throws {AppError} CLAUDE_UNAVAILABLE | AGENT_LOOP_ERROR
 */
async function ejecutarLoop({ messages, systemPrompt, tools, userId }) {
  let iteraciones = 0;
  try {
    while (iteraciones < MAX_ITERACIONES) {
      iteraciones++;
      // eslint-disable-next-line no-await-in-loop
      const respuesta = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });
      logger.info('Respuesta de Claude', {
        userId,
        iteracion: iteraciones,
        stop_reason: respuesta.stop_reason,
      });

      if (respuesta.stop_reason === 'end_turn') {
        messages.push({ role: 'assistant', content: respuesta.content });
        return { respuesta: extraerTexto(respuesta.content), mensajesActualizados: messages };
      }

      if (respuesta.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: respuesta.content });
        // eslint-disable-next-line no-await-in-loop
        const resultados = await Promise.all(
          respuesta.content
            .filter((b) => b.type === 'tool_use')
            .map(async (b) => {
              try {
                const resultado = await ejecutarTool(b.name, b.input, userId);
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: JSON.stringify(resultado),
                };
              } catch (toolErr) {
                logger.warn('Error ejecutando tool', { tool: b.name, error: toolErr.message });
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: `Error: ${toolErr.message}`,
                  is_error: true,
                };
              }
            })
        );
        messages.push({ role: 'user', content: resultados });
        continue;
      }

      break; // stop_reason inesperado
    }
    throw new AppError('El agente alcanzó el máximo de iteraciones', 'AGENT_LOOP_ERROR', 500);
  } catch (err) {
    if (err.isOperational) throw err;
    if (err.status === 529 || err.status === 503 || err.status === 502) {
      throw new AppError('Claude no está disponible temporalmente', 'CLAUDE_UNAVAILABLE', 503);
    }
    logger.error('Error en loop del agente', { error: err.message, userId });
    throw new AppError('Error en el loop del agente', 'AGENT_LOOP_ERROR', 500);
  }
}

module.exports = { ejecutarLoop };
