// tools/toolDefinitions/toolsBusqueda.js
// Schemas de herramientas de búsqueda web, normativa y ordenanzas.

const toolsBusqueda = [
  {
    name: 'buscar_web',
    description:
      'Busca información en la web sobre cualquier tema. ' +
      'Usá esta tool cuando el usuario pida buscar noticias, precios, información general o datos actuales. ' +
      'Devuelve título, fragmento y URL de los resultados más relevantes.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto de búsqueda',
        },
        maxResultados: {
          type: 'number',
          description: 'Cantidad máxima de resultados (default 5, máximo 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'buscar_normativa',
    description:
      'Busca leyes, decretos y resoluciones en Infoleg y SAIJ (bases legales oficiales de Argentina). ' +
      'Usá esta tool cuando el usuario consulte normativa nacional, leyes, decretos o resoluciones. ' +
      'Podés filtrar por organismo emisor.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Término de búsqueda (ej: "ley 27275", "habeas data", "protección de datos")',
        },
        organismo: {
          type: 'string',
          description: 'Filtro por organismo emisor (opcional, ej: "Ministerio de Economía")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'buscar_ordenanzas',
    description:
      'Busca ordenanzas y normativa municipal del Partido de Escobar. ' +
      'Usá esta tool cuando el usuario pregunte por regulaciones, ordenanzas o disposiciones locales. ' +
      'Devuelve número, título y enlace de cada ordenanza encontrada.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Tema o número de ordenanza a buscar (ej: "habilitaciones comerciales", "ordenanza 4521")',
        },
      },
      required: ['query'],
    },
  },
];

module.exports = { toolsBusqueda };
