// agent.js
// Orquestador del agente KarIA Escobar: construye contexto y delega el loop.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');
const { AppError } = require('./middleware/errorHandler');
const logger = require('./utils/logger').child({ module: 'agent' });
const { TOOLS } = require('./tools');
const funcionalidadService = require('./services/funcionalidadService');
const { ejecutarLoop } = require('./utils/agentLoop');
const { SYSTEM_PROMPT, SYSTEM_PROMPT_CONFIGURADOR } = require('./config/systemPrompts');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

/**
 * Ejecuta el agente principal con historial y herramientas.
 * Construye el system prompt dinámico y delega el loop a agentLoop.
 *
 * @param {{ mensaje: string, historial: Object[], userId: string }} params
 * @returns {Promise<{ respuesta: string, mensajesActualizados: Object[] }>}
 * @throws {AppError} CLAUDE_UNAVAILABLE | AGENT_LOOP_ERROR
 */
async function ejecutarAgente({ mensaje, historial, userId }) {
  const messages = [
    ...historial.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: mensaje },
  ];

  let systemPrompt = SYSTEM_PROMPT;
  try {
    const dinamico = await funcionalidadService.buildSystemPrompt(userId);
    if (dinamico) systemPrompt = dinamico;
  } catch (_) {
    logger.warn('No se pudo cargar system prompt dinámico, usando fallback', { userId });
  }

  return ejecutarLoop({ messages, systemPrompt, tools: TOOLS, userId });
}

/**
 * Ejecuta el agente configurador sin herramientas ni persistencia.
 * El historial lo maneja el frontend en memoria.
 *
 * @param {{ mensaje: string, historial: Array<{role: string, content: string}> }} params
 * @returns {Promise<{ respuesta: string }>}
 * @throws {AppError} CLAUDE_UNAVAILABLE | AGENT_LOOP_ERROR
 */
async function ejecutarAgenteConfigurador({ mensaje, historial }) {
  const messages = [
    ...historial.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: mensaje },
  ];
  try {
    const res = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT_CONFIGURADOR,
      messages,
    });
    return {
      respuesta: res.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join(''),
    };
  } catch (err) {
    if (err.status === 529 || err.status === 503 || err.status === 502) {
      throw new AppError('Claude no está disponible temporalmente', 'CLAUDE_UNAVAILABLE', 503);
    }
    logger.error('Error en agente configurador', { error: err.message });
    throw new AppError('Error en el agente configurador', 'AGENT_LOOP_ERROR', 500);
  }
}

module.exports = { ejecutarAgente, ejecutarAgenteConfigurador };
