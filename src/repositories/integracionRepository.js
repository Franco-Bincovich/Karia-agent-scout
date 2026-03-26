// repositories/integracionRepository.js
// Único punto de contacto con la tabla integraciones-escobar.
// Nunca SQL raw — siempre el ORM de Supabase.

const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger').child({ module: 'integracionRepository' });

/**
 * Devuelve todas las integraciones de un usuario.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function findByUser(userId) {
  const { data, error } = await supabase
    .from('integraciones-escobar')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false });

  if (error) {
    logger.error('Error en findByUser integracion', { error: error.message });
    throw new AppError('Error al obtener integraciones', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Devuelve una integración específica de un usuario por tipo.
 *
 * @param {string} userId
 * @param {string} tipo
 * @returns {Promise<Object|null>}
 */
async function findByUserAndTipo(userId, tipo) {
  const { data, error } = await supabase
    .from('integraciones-escobar')
    .select('*')
    .eq('user_id', userId)
    .eq('tipo', tipo)
    .maybeSingle();

  if (error) {
    logger.error('Error en findByUserAndTipo', { error: error.message });
    throw new AppError('Error al obtener integración', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Crea o actualiza una integración (ON CONFLICT user_id, tipo → UPDATE).
 *
 * @param {string} userId
 * @param {string} tipo
 * @param {Object} credenciales - objeto ya cifrado antes de llamar a este repo
 * @returns {Promise<Object>} integración creada o actualizada
 */
async function upsert(userId, tipo, credenciales) {
  const { data, error } = await supabase
    .from('integraciones-escobar')
    .upsert(
      { user_id: userId, tipo, credenciales, activo: true, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,tipo' }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error en upsert integracion', { error: error.message });
    throw new AppError('Error al guardar integración', 'DB_ERROR', 500);
  }
  return data;
}

/**
 * Marca una integración como inactiva sin eliminar las credenciales.
 *
 * @param {string} userId
 * @param {string} tipo
 * @returns {Promise<Object>} integración actualizada
 * @throws {AppError} code: 'INTEGRACION_NOT_FOUND'
 */
async function desactivar(userId, tipo) {
  const { data, error } = await supabase
    .from('integraciones-escobar')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('tipo', tipo)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error en desactivar integracion', { error: error.message });
    throw new AppError('Error al desactivar integración', 'DB_ERROR', 500);
  }
  if (!data) throw new AppError('Integración no encontrada', 'INTEGRACION_NOT_FOUND', 404);
  return data;
}

/**
 * Elimina permanentemente una integración.
 *
 * @param {string} userId
 * @param {string} tipo
 * @returns {Promise<void>}
 * @throws {AppError} code: 'INTEGRACION_NOT_FOUND'
 */
async function eliminar(userId, tipo) {
  const { data, error } = await supabase
    .from('integraciones-escobar')
    .delete()
    .eq('user_id', userId)
    .eq('tipo', tipo)
    .select()
    .maybeSingle();

  if (error) {
    logger.error('Error en eliminar integracion', { error: error.message });
    throw new AppError('Error al eliminar integración', 'DB_ERROR', 500);
  }
  if (!data) throw new AppError('Integración no encontrada', 'INTEGRACION_NOT_FOUND', 404);
}

module.exports = { findByUser, findByUserAndTipo, upsert, desactivar, eliminar };
