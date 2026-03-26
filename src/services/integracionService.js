// services/integracionService.js
// Lógica de negocio para integraciones de terceros.
// Las credenciales se cifran con AES-256-CBC antes de persistir y nunca
// se exponen al frontend — solo el agente las consume via getCredenciales().

const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const integracionRepo = require('../repositories/integracionRepository');
const logger = require('../utils/logger').child({ module: 'integracionService' });

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const TIPOS_API_KEY = ['anthropic', 'openai', 'perplexity', 'gamma'];
const TIPOS_GOOGLE = ['gmail', 'drive', 'calendar'];

// Deriva una clave de 32 bytes estable a partir del JWT_SECRET.
function derivarClave() {
  return crypto.scryptSync(config.jwt.secret, 'karia-escobar-integraciones', 32);
}

function cifrar(texto) {
  const clave = derivarClave();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, clave, iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cifrado.toString('hex')}`;
}

function descifrar(valor) {
  const [ivHex, textoHex] = valor.split(':');
  const clave = derivarClave();
  const decipher = crypto.createDecipheriv(ALGORITHM, clave, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(textoHex, 'hex')), decipher.final()]).toString(
    'utf8'
  );
}

/**
 * Lista las integraciones activas de un usuario sin exponer credenciales.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ id, tipo, activo, connected_at, updated_at }>>}
 */
async function listarIntegraciones(userId) {
  const rows = await integracionRepo.findByUser(userId);
  return rows
    .filter((r) => r.activo)
    .map(({ id, tipo, activo, connected_at, updated_at }) => ({
      id,
      tipo,
      activo,
      connected_at,
      updated_at,
    }));
}

/**
 * Guarda una API key cifrada para integraciones de tipo 'anthropic' u 'openai'.
 *
 * @param {string} userId
 * @param {string} tipo - 'anthropic' | 'openai'
 * @param {string} apiKey
 * @returns {Promise<{ id, tipo, connected_at }>}
 * @throws {AppError} code: 'TIPO_INVALIDO' si tipo no es anthropic/openai
 * @throws {AppError} code: 'API_KEY_INVALIDA' si apiKey está vacía
 */
async function guardarApiKey(userId, tipo, apiKey) {
  if (!TIPOS_API_KEY.includes(tipo)) {
    throw new AppError(
      `Tipo inválido. Valores permitidos: ${TIPOS_API_KEY.join(', ')}`,
      'TIPO_INVALIDO',
      400
    );
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new AppError('La API key no puede estar vacía', 'API_KEY_INVALIDA', 400);
  }

  const credenciales = { api_key: cifrar(apiKey.trim()) };
  const row = await integracionRepo.upsert(userId, tipo, credenciales);

  logger.info('API key guardada', { userId, tipo });
  return { id: row.id, tipo: row.tipo, connected_at: row.connected_at };
}

/**
 * Guarda tokens OAuth de Google cifrados para 'gmail', 'drive' o 'calendar'.
 *
 * @param {string} userId
 * @param {string} tipo - 'gmail' | 'drive' | 'calendar'
 * @param {{ access_token: string, refresh_token: string, expiry: string|number }} tokens
 * @returns {Promise<{ id, tipo, connected_at }>}
 * @throws {AppError} code: 'TIPO_INVALIDO' | 'TOKENS_INVALIDOS'
 */
async function guardarTokenGoogle(userId, tipo, tokens) {
  if (!TIPOS_GOOGLE.includes(tipo)) {
    throw new AppError(
      `Tipo inválido. Valores permitidos: ${TIPOS_GOOGLE.join(', ')}`,
      'TIPO_INVALIDO',
      400
    );
  }
  const { access_token, refresh_token, expiry } = tokens || {};
  if (!access_token || !refresh_token) {
    throw new AppError('access_token y refresh_token son obligatorios', 'TOKENS_INVALIDOS', 400);
  }

  const credenciales = {
    access_token: cifrar(access_token),
    refresh_token: cifrar(refresh_token),
    expiry: expiry ? cifrar(String(expiry)) : null,
  };
  const row = await integracionRepo.upsert(userId, tipo, credenciales);

  logger.info('Token Google guardado', { userId, tipo });
  return { id: row.id, tipo: row.tipo, connected_at: row.connected_at };
}

/**
 * Elimina permanentemente una integración.
 *
 * @param {string} userId
 * @param {string} tipo
 * @returns {Promise<void>}
 */
async function desconectar(userId, tipo) {
  await integracionRepo.eliminar(userId, tipo);
  logger.info('Integración desconectada', { userId, tipo });
}

/**
 * Devuelve las credenciales desencriptadas de una integración.
 * USO EXCLUSIVO DEL AGENTE — nunca exponer al frontend.
 *
 * @param {string} userId
 * @param {string} tipo
 * @returns {Promise<Object>} credenciales en plain text
 * @throws {AppError} code: 'INTEGRACION_NOT_FOUND' | 'INTEGRACION_INACTIVA'
 */
async function getCredenciales(userId, tipo) {
  const row = await integracionRepo.findByUserAndTipo(userId, tipo);
  if (!row) throw new AppError('Integración no encontrada', 'INTEGRACION_NOT_FOUND', 404);
  if (!row.activo)
    throw new AppError('La integración está desactivada', 'INTEGRACION_INACTIVA', 403);

  const descifradas = {};
  for (const [campo, valor] of Object.entries(row.credenciales)) {
    descifradas[campo] = valor ? descifrar(valor) : null;
  }
  return descifradas;
}

module.exports = {
  listarIntegraciones,
  guardarApiKey,
  guardarTokenGoogle,
  desconectar,
  getCredenciales,
};
