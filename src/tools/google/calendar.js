// tools/google/calendar.js
// Herramientas Calendar: listar eventos próximos y crear evento.

const { google } = require('googleapis');
const { getGoogleClient } = require('../../integrations/googleClient');
const { withCircuitBreaker } = require('../../utils/circuitBreaker');
const { withRetry } = require('../../utils/reintentos');
const logger = require('../../utils/logger').child({ module: 'calendar' });

const TZ = 'America/Argentina/Buenos_Aires';
const soloTransitorios = (err) => !err.isOperational && (!err.code || err.code >= 500);

// ── leerCalendar ─────────────────────────────────────────────────────────────

/**
 * Lista los eventos de los próximos N días en el calendario principal.
 *
 * @param {{ userId: string, dias?: number }} params
 * @returns {Promise<Array<{ id, titulo, fecha, hora, lugar, descripcion }>>}
 */
async function _leerCalendar({ userId, dias = 7 }) {
  const auth = await getGoogleClient(userId, 'calendar');
  const calendar = google.calendar({ version: 'v3', auth });

  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + Math.min(dias, 60) * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: ahora.toISOString(),
    timeMax: hasta.toISOString(),
    maxResults: 25,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items || []).map((evento) => {
    const inicio = evento.start?.dateTime || evento.start?.date || '';
    const hora = evento.start?.dateTime
      ? new Date(evento.start.dateTime).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: TZ,
        })
      : 'Todo el día';
    const fecha = inicio.split('T')[0] || inicio;
    return {
      id: evento.id,
      titulo: evento.summary || '(sin título)',
      fecha,
      hora,
      lugar: evento.location || '',
      descripcion: evento.description || '',
    };
  });
}

// ── crearEvento ───────────────────────────────────────────────────────────────

/**
 * Crea un evento en el calendario principal del usuario.
 *
 * @param {{ userId: string, titulo: string, fecha: string, hora: string, duracionMinutos?: number, descripcion?: string }} params
 * @returns {Promise<{ ok: boolean, id: string, titulo: string, inicio: string, url: string }>}
 */
async function _crearEvento({
  userId,
  titulo,
  fecha,
  hora,
  duracionMinutos = 60,
  descripcion = '',
}) {
  const auth = await getGoogleClient(userId, 'calendar');
  const calendar = google.calendar({ version: 'v3', auth });

  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: titulo,
      description: descripcion,
      start: { dateTime: inicio.toISOString(), timeZone: TZ },
      end: { dateTime: fin.toISOString(), timeZone: TZ },
    },
  });

  logger.info('Evento creado', { userId, titulo, fecha });
  return {
    ok: true,
    id: res.data.id,
    titulo: res.data.summary,
    inicio: res.data.start?.dateTime,
    url: res.data.htmlLink || '',
  };
}

// ── Export con resilencia ────────────────────────────────────────────────────

const cbOpts = { maxFallos: 3, cooldownMs: 20_000 };
const retOpts = { maxIntentos: 2, delayBase: 1_000, shouldRetry: soloTransitorios };

const leerCalendar = withCircuitBreaker(withRetry(_leerCalendar, retOpts), {
  ...cbOpts,
  nombre: 'calendar-leer',
});
const crearEvento = withCircuitBreaker(withRetry(_crearEvento, retOpts), {
  ...cbOpts,
  nombre: 'calendar-crear',
});

module.exports = { leerCalendar, crearEvento };
