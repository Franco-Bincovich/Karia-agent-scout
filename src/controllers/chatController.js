// controllers/chatController.js
// Orquesta el flujo de /api/chat. Sin lógica de negocio.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { ejecutarAgente, ejecutarAgenteConfigurador } = require('../agent');
const cola = require('../utils/cola');
const conversacionRepo = require('../repositories/conversacionRepository');
const logger = require('../utils/logger').child({ module: 'chatController' });

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

/**
 * Genera un título corto para una conversación nueva usando Claude.
 * Se ejecuta en background — no bloquea la respuesta al usuario.
 *
 * @param {string} conversacionId
 * @param {string} primerMensaje
 */
async function generarTitulo(conversacionId, primerMensaje) {
  try {
    const res = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: `Generá un título de máximo 4 palabras en español para una conversación que empieza con este mensaje: '${primerMensaje}'. Respondé SOLO el título, sin comillas ni puntuación.`,
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
 * POST /api/chat
 * Body: { mensaje: string, conversacionId?: string }
 * Requiere JWT válido (req.user adjuntado por verificarToken).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function chat(req, res, next) {
  try {
    const { mensaje, conversacionId } = req.body;
    const { userId } = req.user;

    // 1. Obtener o crear conversación
    let conversacion;
    if (conversacionId) {
      conversacion = await conversacionRepo.findById(conversacionId, userId);
      if (!conversacion) {
        throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);
      }
    } else {
      conversacion = await conversacionRepo.create(userId);
    }

    // 2. Cargar historial
    const historial = conversacion.messages || [];

    logger.info('Iniciando chat', {
      userId,
      conversacionId: conversacion.id,
      mensajeLen: mensaje.length,
    });

    // 3 & 4. Encolar y ejecutar el agente
    const resultado = await cola.add(() => ejecutarAgente({ mensaje, historial, userId }));

    // 5. Persistir mensajes actualizados
    await conversacionRepo.updateMessages(conversacion.id, resultado.mensajesActualizados, userId);

    // 6. Responder
    res.json({ respuesta: resultado.respuesta, conversacionId: conversacion.id });

    // 7. Generar título en background (solo conversaciones nuevas)
    if (!conversacionId) {
      generarTitulo(conversacion.id, mensaje);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversaciones
 * Lista las últimas 20 conversaciones del usuario autenticado.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function listarConversaciones(req, res, next) {
  try {
    const { userId } = req.user;
    logger.info('Listando conversaciones', { userId });

    const conversaciones = await conversacionRepo.findByUser(userId);
    res.json({ conversaciones });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversaciones/:id
 * Carga una conversación específica verificando ownership.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function cargarConversacion(req, res, next) {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    logger.info('Cargando conversación', { userId, conversacionId: id });

    const conversacion = await conversacionRepo.findById(id, userId);
    if (!conversacion) {
      throw new AppError('Conversación no encontrada', 'CONVERSACION_NOT_FOUND', 404);
    }

    // Extrae texto de un content que puede ser string o array de bloques Anthropic.
    function extraerTexto(content) {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('');
      }
      return '';
    }

    const mensajes = (conversacion.messages || [])
      .filter((m) => {
        // Descartar mensajes de tool: role 'user' con content array (tool_result)
        // y role 'assistant' con content array que no tiene bloques de texto (puro tool_use)
        if (m.role !== 'user' && m.role !== 'assistant') return false;
        if (Array.isArray(m.content)) {
          const tieneTexto = m.content.some((b) => b.type === 'text');
          return tieneTexto;
        }
        return typeof m.content === 'string' && m.content.length > 0;
      })
      .map((m) => ({
        id: m.id || null,
        rol: m.role === 'user' ? 'user' : 'agent',
        texto: extraerTexto(m.content),
        timestamp: m.timestamp || conversacion.updated_at,
      }));

    res.json({ conversacion: { id: conversacion.id, titulo: conversacion.titulo }, mensajes });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/configurador
 * Body: { mensaje: string, historial?: Array<{role,content}> }
 * Sin persistencia — el historial vive en memoria del frontend.
 */
async function chatConfigurador(req, res, next) {
  try {
    const { mensaje, historial = [] } = req.body;
    const { respuesta } = await ejecutarAgenteConfigurador({ mensaje, historial });
    res.json({ respuesta });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, listarConversaciones, cargarConversacion, chatConfigurador };
