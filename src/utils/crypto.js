// utils/crypto.js
// Cifrado simétrico AES-256-CBC para credenciales de integraciones.
// USO EXCLUSIVO de integracionService — no exponer al frontend.

const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/** Deriva una clave de 32 bytes estable a partir del JWT_SECRET. */
function derivarClave() {
  return crypto.scryptSync(config.jwt.secret, 'karia-escobar-integraciones', 32);
}

/**
 * Cifra un texto plano con AES-256-CBC.
 *
 * @param {string} texto - Valor a cifrar
 * @returns {string} Cadena con formato "ivHex:cifradoHex"
 */
function cifrar(texto) {
  const clave = derivarClave();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, clave, iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cifrado.toString('hex')}`;
}

/**
 * Descifra un valor cifrado con AES-256-CBC.
 *
 * @param {string} valor - Cadena con formato "ivHex:cifradoHex"
 * @returns {string} Texto plano descifrado
 */
function descifrar(valor) {
  if (typeof valor !== 'string' || !valor.includes(':')) {
    throw new AppError('Credencial con formato inválido', 'CRYPTO_FORMAT_ERROR', 500);
  }
  const [ivHex, textoHex] = valor.split(':');
  const clave = derivarClave();
  const decipher = crypto.createDecipheriv(ALGORITHM, clave, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(textoHex, 'hex')), decipher.final()]).toString(
    'utf8'
  );
}

module.exports = { cifrar, descifrar };
