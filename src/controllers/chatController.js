// controllers/chatController.js
// Orquesta el flujo de /api/chat. Sin lógica de negocio.

const { ejecutarAgente, ejecutarAgenteConfigurador } = require('../agent');
const cola = require('../utils/cola');
const conversacionRepo = require('../repositories/conversacionRepository');
const logger = require('../utils/logger').child({ module: 'chatController' });
const chatService = require('../services/chatService');

/**
 * POST /api/chat
 * Body: { mensaje: string, conversacionId?: string }
 * Requiere JWT válido (req.user adjuntado por verificarToken).
 */
async function chat(req, res, next) {
  try {
    const { mensaje, conversacionId } = req.body;
    const { userId } = req.user;

    const conversacion = await chatService.obtenerOCrearConversacion(conversacionId, userId);
    const historial = conversacion.messages || [];

    logger.info('Iniciando chat', {
      userId,
      conversacionId: conversacion.id,
      mensajeLen: mensaje.length,
    });
    const resultado = await cola.add(() => ejecutarAgente({ mensaje, historial, userId }));
    await conversacionRepo.updateMessages(conversacion.id, resultado.mensajesActualizados, userId);
    res.json({ respuesta: resultado.respuesta, conversacionId: conversacion.id });
    if (!conversacionId) chatService.generarTituloBackground(conversacion.id, mensaje);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversaciones
 * Lista las últimas 20 conversaciones del usuario autenticado.
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
 * Carga una conversación y formatea sus mensajes para el frontend.
 */
async function cargarConversacion(req, res, next) {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    logger.info('Cargando conversación', { userId, conversacionId: id });
    const resultado = await chatService.cargarConversacionFormateada(id, userId);
    res.json(resultado);
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
