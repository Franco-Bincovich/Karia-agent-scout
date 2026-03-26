// repositories/funcionalidadRepository.js
// Único punto de contacto con la tabla funcionalidades-escobar.
// Nunca SQL raw — siempre el ORM de Supabase.

const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'funcionalidadRepository' });

/**
 * Devuelve las funcionalidades activas de un usuario, ordenadas por fecha de creación.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function findActiveByUser(userId) {
  const { data, error } = await supabase
    .from('funcionalidades-escobar')
    .select('*')
    .eq('user_id', userId)
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error en findActiveByUser funcionalidad', { error: error.message });
    throw new AppError('Error al obtener funcionalidades', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Devuelve todas las funcionalidades de un usuario, incluyendo inactivas.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function findAllByUser(userId) {
  const { data, error } = await supabase
    .from('funcionalidades-escobar')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error en findAllByUser funcionalidad', { error: error.message });
    throw new AppError('Error al obtener funcionalidades', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Crea una nueva funcionalidad para un usuario.
 *
 * @param {string} userId
 * @param {{ nombre: string, descripcion?: string|null, system_prompt: string }} datos
 * @returns {Promise<Object>}
 */
async function create(userId, datos) {
  const { data, error } = await supabase
    .from('funcionalidades-escobar')
    .insert({ user_id: userId, ...datos })
    .select()
    .single();

  if (error) {
    logger.error('Error en create funcionalidad', { error: error.message });
    throw new AppError('Error al crear funcionalidad', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Actualiza campos de una funcionalidad verificando ownership.
 *
 * @param {string} id
 * @param {string} userId
 * @param {Object} campos
 * @returns {Promise<Object>}
 * @throws {AppError} code: 'FUNCIONALIDAD_NOT_FOUND'
 */
async function update(id, userId, campos) {
  const { data, error } = await supabase
    .from('funcionalidades-escobar')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error en update funcionalidad', { error: error.message });
    throw new AppError('Error al actualizar funcionalidad', 'DB_ERROR', 500);
  }
  if (!data) throw new AppError('Funcionalidad no encontrada', 'FUNCIONALIDAD_NOT_FOUND', 404);
  return data;
}

/**
 * Cambia el campo activo de true→false o false→true.
 *
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<Object>} funcionalidad con el nuevo valor de activo
 * @throws {AppError} code: 'FUNCIONALIDAD_NOT_FOUND'
 */
async function toggleActivo(id, userId) {
  const { data: actual, error: errLectura } = await supabase
    .from('funcionalidades-escobar')
    .select('activo')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (errLectura) {
    logger.error('Error leyendo funcionalidad para toggle', { error: errLectura.message });
    throw new AppError('Error al obtener funcionalidad', 'DB_ERROR', 500);
  }
  if (!actual) throw new AppError('Funcionalidad no encontrada', 'FUNCIONALIDAD_NOT_FOUND', 404);

  return update(id, userId, { activo: !actual.activo });
}

module.exports = { findActiveByUser, findAllByUser, create, update, toggleActivo };
