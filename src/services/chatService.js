// services/chatService.js
// Lógica de negocio de conversaciones: obtener/crear, título automático y formateo.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const conversacionRepo = require('../repositories/conversacionRepository');
const logger = require('../utils/logger').child({ module: 'chatService' });

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

function extraerTextoBloque(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content))
    return content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
  return '';
}

/**
 * Obtiene una conversación existente o crea una nueva.
 *
 * @param {string|undefined} conversacionId - ID existente o undefined para crear
 * @param {string} userId
 * @returns {Promise<Object>} conversación de Supabase
 * @throws {AppError} CONVERSACION_NOT_FOUND
 */
async function obtenerOCrearConversacion(conversacionId, userId) {
  if (conversacionId) {
    const conv = await conversacionRepo.findById(conversacionId, userId);
    if (!conv) throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);
    return conv;
  }
  return conversacionRepo.create(userId);
}

/**
 * Genera un título corto usando Claude y lo persiste. Fire-and-forget — no lanzar await.
 *
 * @param {string} conversacionId
 * @param {string} primerMensaje
 */
async function generarTituloBackground(conversacionId, primerMensaje) {
  try {
    const res = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 20,
      // eslint-disable-next-line max-len
      messages: [
        {
          role: 'user',
          content: `Generá un título de máximo 4 palabras en español para una conversación que empieza con: '${primerMensaje}'. Respondé SOLO el título, sin comillas ni puntuación.`,
        },
      ],
    });
    const titulo = res.content[0].text.trim();
    await conversacionRepo.update(conversacionId, { titulo });
    logger.info('Título generado', { conversacionId, titulo });
  } catch (err) {
    logger.error('Error generando título', { conversacionId, error: err.message });
  }
}

/**
 * Carga una conversación y formatea sus mensajes para el frontend.
 * Filtra tool_use/tool_result — solo devuelve mensajes con texto visible.
 *
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<{ conversacion: Object, mensajes: Object[] }>}
 * @throws {AppError} CONVERSACION_NOT_FOUND
 */
async function cargarConversacionFormateada(id, userId) {
  const conversacion = await conversacionRepo.findById(id, userId);
  if (!conversacion)
    throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);

  const mensajes = (conversacion.messages || [])
    .filter((m) => {
      if (m.role !== 'user' && m.role !== 'assistant') return false;
      if (Array.isArray(m.content)) return m.content.some((b) => b.type === 'text');
      return typeof m.content === 'string' && m.content.length > 0;
    })
    .map((m) => ({
      id: m.id || null,
      rol: m.role === 'user' ? 'user' : 'agent',
      texto: extraerTextoBloque(m.content),
      timestamp: m.timestamp || conversacion.updated_at,
    }));

  return { conversacion: { id: conversacion.id, titulo: conversacion.titulo }, mensajes };
}

module.exports = {
  obtenerOCrearConversacion,
  generarTituloBackground,
  cargarConversacionFormateada,
};
