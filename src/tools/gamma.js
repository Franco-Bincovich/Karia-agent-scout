// tools/gamma.js
// Generación de presentaciones y documentos con Gamma AI.

const { AppError } = require('../middleware/errorHandler');
const integracionService = require('../services/integracionService');
const { generarPresentacionGamma } = require('../integrations/gammaClient');
const { withCircuitBreaker } = require('../utils/circuitBreaker');
const { withRetry } = require('../utils/reintentos');
const logger = require('../utils/logger').child({ module: 'gamma' });

const soloTransitorios = (err) => !err.isOperational;

/**
 * Genera una presentación, documento o página web usando Gamma AI.
 * Requiere que el usuario tenga la integración 'gamma' activa.
 *
 * @param {{ userId: string, titulo: string, contenido: string, formato?: string }} params
 * @returns {Promise<{ url: string, titulo: string }>}
 * @throws {AppError} GAMMA_NOT_CONNECTED | GAMMA_API_ERROR
 */
async function _generarPresentacion({ userId, titulo, contenido, formato = 'presentacion' }) {
  let creds;
  try {
    creds = await integracionService.getCredenciales(userId, 'gamma');
  } catch (err) {
    if (err.code === 'INTEGRACION_NOT_FOUND' || err.code === 'INTEGRACION_INACTIVA') {
      throw new AppError(
        'Conectá tu cuenta de Gamma desde Integraciones para generar presentaciones.',
        'GAMMA_NOT_CONNECTED',
        400
      );
    }
    throw err;
  }

  logger.info('Generando presentación Gamma', { userId, titulo, formato });
  return generarPresentacionGamma(creds.api_key, { titulo, contenido, formato });
}

const generarPresentacion = withCircuitBreaker(
  withRetry(_generarPresentacion, {
    maxIntentos: 2,
    delayBase: 2_000,
    shouldRetry: soloTransitorios,
  }),
  { maxFallos: 3, cooldownMs: 60_000, nombre: 'gamma-generar' }
);

module.exports = { generarPresentacion };
