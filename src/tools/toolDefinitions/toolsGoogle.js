// tools/toolDefinitions/toolsGoogle.js
// Definiciones de herramientas Google Workspace para el agente.

const toolsGoogle = [
  {
    name: 'leer_gmail',
    description:
      'Lee los últimos emails no leídos de la cuenta Gmail del usuario. ' +
      'Usá esta tool cuando el usuario pida ver su bandeja de entrada, emails pendientes o correos sin leer. ' +
      'Requiere que Google esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        cantidad: {
          type: 'number',
          description: 'Cantidad de emails a leer (máximo 20, default 5)',
        },
      },
      required: [],
    },
  },
  {
    name: 'enviar_gmail',
    description:
      'Envía un email desde la cuenta Gmail del usuario. ' +
      'Pedí siempre confirmación antes de enviar. ' +
      'Requiere que Google esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        para: {
          type: 'string',
          description: 'Dirección de email del destinatario',
        },
        asunto: {
          type: 'string',
          description: 'Asunto del email',
        },
        cuerpo: {
          type: 'string',
          description: 'Cuerpo del email en texto plano',
        },
      },
      required: ['para', 'asunto', 'cuerpo'],
    },
  },
  {
    name: 'leer_calendar',
    description:
      'Lista los próximos eventos del calendario del usuario. ' +
      'Usala cuando pregunte por su agenda, reuniones o compromisos. ' +
      'Requiere que Google esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        dias: {
          type: 'number',
          description: 'Cantidad de días hacia adelante a consultar (máximo 60, default 7)',
        },
      },
      required: [],
    },
  },
  {
    name: 'crear_evento',
    description:
      'Crea un evento en el calendario principal del usuario. ' +
      'Pedí siempre confirmación de fecha, hora y título antes de crear. ' +
      'Usá el formato YYYY-MM-DD para fecha y HH:MM para hora. ' +
      'Requiere que Google esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título del evento',
        },
        fecha: {
          type: 'string',
          description: 'Fecha del evento en formato YYYY-MM-DD',
        },
        hora: {
          type: 'string',
          description: 'Hora de inicio en formato HH:MM (24hs)',
        },
        duracionMinutos: {
          type: 'number',
          description: 'Duración en minutos (default 60)',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción o notas del evento (opcional)',
        },
      },
      required: ['titulo', 'fecha', 'hora'],
    },
  },
  {
    name: 'buscar_drive',
    description:
      'Busca archivos en Google Drive del usuario por nombre o contenido. ' +
      'Devuelve nombre, tipo, link de acceso y fecha de modificación. ' +
      'Requiere que Google esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda: nombre del archivo o texto que contiene',
        },
      },
      required: ['query'],
    },
  },
];

module.exports = { toolsGoogle };
