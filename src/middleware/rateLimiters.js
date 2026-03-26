// middleware/rateLimiters.js
// Singletons de rate limiting compartidos entre routes.
// Centraliza la configuración para que un solo cambio en config/index.js
// afecte todos los endpoints que usen cada limiter.

const rateLimit = require('express-rate-limit');
const config = require('../config');

const MENSAJE_LIMITE = {
  error: true,
  message: 'Demasiadas solicitudes, intentá de nuevo más tarde',
  code: 'RATE_LIMIT_EXCEEDED',
};

/**
 * Rate limiter general para endpoints de API (integraciones, funcionalidades).
 * Configuración: config.rateLimit.api (100 req / 15 min por defecto).
 */
const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: MENSAJE_LIMITE,
});

/**
 * Rate limiter para endpoints de upload de archivos.
 * Usa la misma config que apiRateLimiter — instancia separada para
 * poder ajustar límites independientemente en el futuro.
 * Configuración: config.rateLimit.api (100 req / 15 min por defecto).
 */
const uploadRateLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: MENSAJE_LIMITE,
});

module.exports = { apiRateLimiter, uploadRateLimiter };
