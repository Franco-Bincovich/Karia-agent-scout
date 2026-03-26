// tools/toolDefinitions/toolsPresentaciones.js
// Schema de herramienta de generación de presentaciones con Gamma AI.

const toolsPresentaciones = [
  {
    name: 'generar_presentacion',
    description:
      'Genera una presentación profesional usando Gamma AI. ' +
      'Formatos disponibles: presentacion (slides), documento (informe), pagina (landing). ' +
      'Usá esta tool cuando el usuario pida crear una presentación, informe visual o página web. ' +
      'Requiere que la integración de Gamma esté activa en Integraciones.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: {
          type: 'string',
          description: 'Título principal de la presentación',
        },
        contenido: {
          type: 'string',
          description:
            'Contenido a incluir: puntos clave, datos, texto libre. ' +
            'Cuanto más detallado, mejor será el resultado.',
        },
        formato: {
          type: 'string',
          enum: ['presentacion', 'documento', 'pagina'],
          description: 'Tipo de output (default: "presentacion")',
        },
      },
      required: ['titulo', 'contenido'],
    },
  },
];

module.exports = { toolsPresentaciones };
