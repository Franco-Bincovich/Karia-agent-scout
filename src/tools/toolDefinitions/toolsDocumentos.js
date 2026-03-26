// tools/toolDefinitions/toolsDocumentos.js
// Schemas de herramientas de generación y análisis de documentos.

const toolsDocumentos = [
  {
    name: 'generar_excel',
    description:
      'Genera un archivo Excel (.xlsx) con datos tabulares. ' +
      'Usá esta tool cuando el usuario pida crear una planilla, tabla, listado o reporte en Excel. ' +
      'Devuelve la ruta del archivo generado para que el usuario pueda descargarlo.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: {
          type: 'string',
          description: 'Nombre del archivo sin extensión (ej: "listado_proveedores")',
        },
        hoja: {
          type: 'string',
          description: 'Nombre de la hoja de cálculo (default: "Datos")',
        },
        columnas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de nombres de columnas (encabezados)',
        },
        filas: {
          type: 'array',
          items: { type: 'array' },
          description:
            'Filas de datos: cada fila es un array de valores en el mismo orden que columnas',
        },
      },
      required: ['nombreArchivo', 'columnas', 'filas'],
    },
  },
  {
    name: 'generar_word',
    description:
      'Genera un documento Word (.docx) con formato formal. ' +
      'Tipos disponibles: oficio, circular, acta, respuesta, general. ' +
      'Usá esta tool cuando el usuario pida redactar un documento institucional.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: {
          type: 'string',
          description: 'Nombre del archivo sin extensión (ej: "oficio_001_2025")',
        },
        titulo: {
          type: 'string',
          description: 'Título principal del documento',
        },
        contenido: {
          type: 'string',
          description: 'Cuerpo del documento en texto plano (podés usar saltos de línea)',
        },
        tipoDocumento: {
          type: 'string',
          enum: ['oficio', 'circular', 'acta', 'respuesta', 'general'],
          description: 'Tipo de documento formal (default: "general")',
        },
        metadatos: {
          type: 'object',
          description: 'Datos adicionales: expediente, destinatario, numero, fecha, firmante, etc.',
        },
      },
      required: ['nombreArchivo', 'titulo', 'contenido'],
    },
  },
  {
    name: 'analizar_documento',
    description:
      'Analiza el contenido de un documento previamente subido (PDF, Word, CSV, TXT). ' +
      'Usá esta tool cuando el usuario pida revisar, resumir o extraer información de un archivo. ' +
      'El contenido ya está extraído — esta tool lo procesa según la instrucción.',
    input_schema: {
      type: 'object',
      properties: {
        contenido: {
          type: 'string',
          description: 'Texto extraído del documento',
        },
        instruccion: {
          type: 'string',
          description: 'Qué hacer con el contenido: resumir, extraer datos, comparar, etc.',
        },
        formatoSalida: {
          type: 'string',
          enum: ['texto_libre', 'bullet_points', 'tabla', 'json'],
          description: 'Formato de la respuesta (default: "texto_libre")',
        },
      },
      required: ['contenido', 'instruccion'],
    },
  },
  {
    name: 'analizar_excel_basico',
    description:
      'Analiza una hoja de Excel exportada como texto (CSV). ' +
      'Usá esta tool cuando el usuario suba un Excel y quiera un análisis rápido de sus datos.',
    input_schema: {
      type: 'object',
      properties: {
        nombreHoja: {
          type: 'string',
          description: 'Nombre de la hoja analizada',
        },
        datos: {
          type: 'string',
          description: 'Contenido de la hoja en formato CSV o texto delimitado por comas',
        },
        instruccion: {
          type: 'string',
          description: 'Qué analizar (default: totales, promedios y observaciones clave)',
        },
      },
      required: ['nombreHoja', 'datos'],
    },
  },
  {
    name: 'analizar_excel_avanzado',
    description:
      'Análisis estadístico completo de un archivo Excel subido al servidor. ' +
      'Calcula suma, promedio, mínimo, máximo por columna y los valores más frecuentes. ' +
      'Usá esta tool cuando el usuario quiera estadísticas detalladas de su Excel.',
    input_schema: {
      type: 'object',
      properties: {
        nombreArchivo: {
          type: 'string',
          description: 'Nombre del archivo Excel (sin ruta ni extensión)',
        },
        instruccion: {
          type: 'string',
          description: 'Instrucción adicional para interpretar los resultados (opcional)',
        },
      },
      required: ['nombreArchivo'],
    },
  },
];

module.exports = { toolsDocumentos };
