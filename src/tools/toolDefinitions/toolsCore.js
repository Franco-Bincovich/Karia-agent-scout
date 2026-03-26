// tools/toolDefinitions/toolsCore.js
// Definiciones de herramientas core del agente.

const toolsCore = [
  {
    name: 'generar_excel',
    description:
      'Genera un archivo Excel (.xlsx) con datos tabulares. Devuelve el nombre del archivo generado.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string', description: 'Nombre del archivo sin extensión' },
        columnas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nombres de las columnas',
        },
        filas: { type: 'array', items: { type: 'array' }, description: 'Filas de datos' },
        hoja: { type: 'string', description: 'Nombre de la hoja (opcional, default: Datos)' },
      },
      required: ['nombreArchivo', 'columnas', 'filas'],
    },
  },
  {
    name: 'generar_word',
    description:
      'Genera un documento Word (.docx). ' +
      'Usá tipoDocumento para aplicar el formato correcto: ' +
      '"oficio" (con número, destinatario, asunto y firma), ' +
      '"circular" (comunicado numerado a todo el personal), ' +
      '"acta" (registro formal de reunión con presentes y orden del día), ' +
      '"respuesta" (nota en respuesta a otro documento), ' +
      '"general" (formato libre). ' +
      'El campo metadatos permite pasar datos estructurados del encabezado según el tipo.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string', description: 'Nombre del archivo sin extensión' },
        titulo: { type: 'string', description: 'Título o asunto del documento' },
        contenido: {
          type: 'string',
          description: 'Cuerpo del documento. Separar párrafos con \\n',
        },
        tipoDocumento: {
          type: 'string',
          enum: ['oficio', 'circular', 'acta', 'respuesta', 'general'],
          description: 'Tipo de documento formal. Default: general',
        },
        metadatos: {
          type: 'object',
          description:
            'Datos del encabezado según el tipo. ' +
            'oficio: { nroOficio, destinatario, cargo, asunto, firmante, cargoFirmante, organismo, fecha }. ' +
            'circular: { nroCircular, destinatario, firmante, cargoFirmante, organismo, fecha }. ' +
            'acta: { nroActa, lugar, presentes (array), ordenDia (array), cierre, fecha }. ' +
            'respuesta: { refDocumento, nroExpediente, destinatario, firmante, cargoFirmante, organismo, fecha }.',
          properties: {},
          additionalProperties: true,
        },
      },
      required: ['nombreArchivo', 'titulo', 'contenido'],
    },
  },
  {
    name: 'analizar_documento',
    description:
      'Analiza el contenido de un documento ya cargado por el usuario con una instrucción específica. ' +
      'Usá esta tool cuando el usuario pida hacer algo concreto con un documento (resumir, extraer datos, ' +
      'comparar secciones, identificar inconsistencias, listar obligaciones, etc.). ' +
      'Devuelve el análisis como texto estructurado.',
    input_schema: {
      type: 'object',
      properties: {
        contenido: {
          type: 'string',
          description: 'Texto completo del documento a analizar',
        },
        instruccion: {
          type: 'string',
          description: 'Qué debe hacer el análisis: resumir, extraer, comparar, identificar, etc.',
        },
        formatoSalida: {
          type: 'string',
          enum: ['texto_libre', 'lista', 'tabla_markdown', 'json'],
          description: 'Formato esperado para la respuesta. Default: texto_libre',
        },
      },
      required: ['contenido', 'instruccion'],
    },
  },
  {
    name: 'analizar_excel_basico',
    description:
      'Analiza datos tabulares de una planilla Excel y devuelve un resumen estructurado con totales, ' +
      'promedios y observaciones clave. Usá esta tool cuando el usuario comparta datos de una hoja de cálculo ' +
      'y pida un análisis, estadísticas o resumen de los números.',
    input_schema: {
      type: 'object',
      properties: {
        nombreHoja: {
          type: 'string',
          description: 'Nombre de la hoja o sección analizada',
        },
        datos: {
          type: 'string',
          description:
            'Contenido de la planilla en formato texto (filas separadas por \\n, columnas por tabulación o coma)',
        },
        instruccion: {
          type: 'string',
          description: 'Qué analizar: totales, comparación de períodos, tendencias, ranking, etc.',
        },
      },
      required: ['nombreHoja', 'datos'],
    },
  },
  {
    name: 'analizar_excel_avanzado',
    description:
      'Analiza un archivo Excel cargado previamente y devuelve estadísticas detalladas por hoja: ' +
      'totales, promedios, mínimos, máximos y valores más frecuentes. ' +
      'Detecta automáticamente columnas numéricas y de texto sin que el usuario tenga que especificar nada. ' +
      'Usalo cuando el usuario pida análisis numérico o estadístico de una planilla, o cuando quiera ' +
      'entender qué contiene un Excel sin tener que describirlo. ' +
      'El archivo debe haberse subido en esta conversación.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: {
          type: 'string',
          description: 'Nombre del archivo Excel (con o sin extensión .xlsx)',
        },
        instruccion: {
          type: 'string',
          description:
            'Contexto opcional sobre qué enfoque darle al análisis (ej: "compará ventas por mes")',
        },
      },
      required: ['nombreArchivo'],
    },
  },
  {
    name: 'generar_presentacion',
    description:
      'Genera una presentación ejecutiva, documento o página web usando Gamma AI. ' +
      'Usá esta tool cuando el usuario pida crear una presentación, deck, informe de gestión o página web. ' +
      'El campo contenido debe incluir los puntos o secciones que debe contener. ' +
      'Requiere que Gamma AI esté conectado desde Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título de la presentación o documento',
        },
        contenido: {
          type: 'string',
          description: 'Descripción del contenido, secciones, puntos clave o datos a incluir',
        },
        formato: {
          type: 'string',
          enum: ['presentacion', 'documento', 'pagina_web'],
          description: 'Tipo de contenido a generar. Default: presentacion',
        },
      },
      required: ['titulo', 'contenido'],
    },
  },
  {
    name: 'buscar_web',
    description:
      'Busca información actualizada en internet. ' +
      'Usá esta tool cuando el usuario pida datos recientes, noticias, precios, eventos o cualquier información ' +
      'que pueda haber cambiado. Usa Perplexity si está conectado, sino Claude con búsqueda web.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término o pregunta de búsqueda',
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
      'Busca normativa legal argentina en Infoleg y/o SAIJ: leyes, decretos, resoluciones y disposiciones. ' +
      'Usá esta tool cuando el usuario pregunte por una ley, decreto, resolución o reglamento nacional.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Número de ley/decreto o palabras clave de la normativa',
        },
        organismo: {
          type: 'string',
          enum: ['infoleg', 'saij', 'ambos'],
          description: 'Fuente de búsqueda. Default: ambos',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'buscar_ordenanzas',
    description:
      'Busca ordenanzas del Honorable Concejo Deliberante del Partido de Escobar. ' +
      'Usá esta tool cuando el usuario pregunte por una ordenanza municipal de Escobar.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Número de ordenanza o palabras clave del tema',
        },
      },
      required: ['query'],
    },
  },
];

module.exports = { toolsCore };
