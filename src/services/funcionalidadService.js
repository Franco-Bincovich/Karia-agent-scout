// services/funcionalidadService.js
// Lógica de negocio para funcionalidades del agente.
// buildSystemPrompt es el contrato principal con agent.js.

const { AppError } = require('../middleware/errorHandler');
const funcionalidadRepo = require('../repositories/funcionalidadRepository');
const logger = require('../utils/logger').child({ module: 'funcionalidadService' });

// Patrones que indican intentos de prompt injection o jailbreak.
const BLOCKLIST_PROMPT = [
  /ignor[aá]/i,
  /ignore/i,
  /override/i,
  /instrucciones anteriores/i,
  /previous instructions/i,
  /jailbreak/i,
  /system.?prompt anterior/i,
  /forget your instructions/i,
  /nueva personalidad/i,
  /act as/i,
  /\bDAN\b/,
  /pretend/i,
  /disregard/i,
  /simulate/i,
  /roleplay/i,
  /from now on/i,
  /new persona/i,
  /forget everything/i,
  /ignore all/i,
  /bypass/i,
  /act[uú]a como/i,
  /fing[ií] que/i,
  /olvid[aá] todo/i,
  /ignor[aá] todo/i,
  /nueva personalidad/i,
  /sin restricciones/i,
];

/**
 * Lista todas las funcionalidades de un usuario (activas e inactivas).
 * Uso exclusivo del frontend para mostrar el panel de funcionalidades.
 *
 * @param {string} userId - ID del usuario autenticado
 * @returns {Promise<Array<{ id: string, nombre: string, descripcion: string|null, activo: boolean, created_at: string }>>}
 */
async function listar(userId) {
  return funcionalidadRepo.findAllByUser(userId);
}

/**
 * Crea una nueva funcionalidad para un usuario.
 *
 * @param {string} userId
 * @param {{ nombre: string, descripcion?: string, system_prompt: string }} datos
 * @returns {Promise<Object>}
 * @throws {AppError} code: 'SYSTEM_PROMPT_REQUERIDO'
 */
async function crear(userId, { nombre, descripcion, system_prompt }) {
  if (!system_prompt || !system_prompt.trim()) {
    throw new AppError('El system prompt no puede estar vacío', 'SYSTEM_PROMPT_REQUERIDO', 400);
  }

  // Normalizar antes de validar: NFC + remover zero-width chars + colapsar espacios
  const promptNormalizado = system_prompt
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const patronDetectado = BLOCKLIST_PROMPT.find((re) => re.test(promptNormalizado));
  if (patronDetectado) {
    logger.warn('Intento de prompt injection bloqueado', {
      userId,
      patron: patronDetectado.toString(),
    });
    throw new AppError(
      'El system prompt contiene contenido no permitido',
      'SYSTEM_PROMPT_INVALIDO',
      400
    );
  }

  const row = await funcionalidadRepo.create(userId, {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    system_prompt: system_prompt.trim(),
  });

  logger.info('Funcionalidad creada', { userId, id: row.id, nombre: row.nombre });
  return row;
}

/**
 * Alterna el estado activo/inactivo de una funcionalidad.
 * Verifica ownership: solo el propietario puede modificar sus funcionalidades.
 *
 * @param {string} id - UUID de la funcionalidad
 * @param {string} userId - ID del usuario autenticado (control de acceso)
 * @returns {Promise<{ id: string, activo: boolean }>}
 * @throws {AppError} code: 'NOT_FOUND' si la funcionalidad no existe o no pertenece al usuario
 */
async function toggleActivo(id, userId) {
  const row = await funcionalidadRepo.toggleActivo(id, userId);
  logger.info('Funcionalidad toggled', { userId, id, activo: row.activo });
  return row;
}

/**
 * Construye el system prompt dinámico combinando las funcionalidades activas del usuario.
 * Devuelve null si no hay funcionalidades activas — el agente usará el prompt base como fallback.
 * Uso exclusivo de agent.js, nunca exponer al frontend.
 *
 * @param {string} userId
 * @returns {Promise<string|null>}
 * @throws {AppError} code: 'DB_ERROR' si falla la consulta a Supabase
 */
async function buildSystemPrompt(userId) {
  const funcionalidades = await funcionalidadRepo.findActiveByUser(userId);
  if (funcionalidades.length === 0) return null;

  return funcionalidades.map((f) => `=== ${f.nombre} ===\n${f.system_prompt}`).join('\n\n');
}

module.exports = { listar, crear, toggleActivo, buildSystemPrompt };
