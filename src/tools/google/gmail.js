// tools/google/gmail.js
// Herramientas Gmail: leer bandeja no leída y enviar emails.

const { google } = require('googleapis');
const { getGoogleClient } = require('../../integrations/googleClient');
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');
const logger = require('../../utils/logger').child({ module: 'gmail' });

const soloTransitorios = (err) => !err.isOperational && (!err.code || err.code >= 500);

// ── leerGmail ────────────────────────────────────────────────────────────────

/**
 * Lee los últimos N emails no leídos del usuario.
 *
 * @param {{ userId: string, cantidad?: number }} params
 * @returns {Promise<Array<{ id, de, asunto, fecha, resumen }>>}
 */
async function _leerGmail({ userId, cantidad = 5 }) {
  const auth = await getGoogleClient(userId, 'gmail');
  const gmail = google.gmail({ version: 'v1', auth });

  const lista = await gmail.users.messages.list({
    userId: 'me',
    maxResults: Math.min(cantidad, 20),
    q: 'is:unread',
  });

  const mensajes = lista.data.messages || [];
  if (mensajes.length === 0) return [];

  const detalles = await Promise.all(
    mensajes.map((m) =>
      gmail.users.messages.get({
        userId: 'me',
        id: m.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })
    )
  );

  return detalles.map((d) => {
    const headers = d.data.payload?.headers || [];
    const get = (n) => headers.find((h) => h.name === n)?.value || '';
    return {
      id: d.data.id,
      de: get('From'),
      asunto: get('Subject'),
      fecha: get('Date'),
      resumen: d.data.snippet || '',
    };
  });
}

// ── enviarGmail ──────────────────────────────────────────────────────────────

/**
 * Envía un email desde la cuenta del usuario.
 *
 * @param {{ userId: string, para: string, asunto: string, cuerpo: string }} params
 * @returns {Promise<{ ok: boolean, para: string, asunto: string }>}
 */
async function _enviarGmail({ userId, para, asunto, cuerpo }) {
  const auth = await getGoogleClient(userId, 'gmail');
  const gmail = google.gmail({ version: 'v1', auth });

  const mime = [
    `To: ${para}`,
    `Subject: ${asunto}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    cuerpo,
  ].join('\r\n');

  const raw = Buffer.from(mime).toString('base64url');

  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  logger.info('Email enviado', { userId, para, asunto });
  return { ok: true, para, asunto };
}

// ── Export con resilencia ────────────────────────────────────────────────────

const cbOpts = { maxFallos: 3, cooldownMs: 20_000 };
const retOpts = { maxIntentos: 2, delayBase: 1_000, shouldRetry: soloTransitorios };

const leerGmail = withCircuitBreaker(withRetry(_leerGmail, retOpts), {
  ...cbOpts,
  nombre: 'gmail-leer',
});
const enviarGmail = withCircuitBreaker(withRetry(_enviarGmail, retOpts), {
  ...cbOpts,
  nombre: 'gmail-enviar',
});

module.exports = { leerGmail, enviarGmail };
