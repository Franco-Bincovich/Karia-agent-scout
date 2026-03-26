// agent.js
// Loop principal del agente Claude con soporte de herramientas.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');
const { AppError } = require('./middleware/errorHandler');
const logger = require('./utils/logger').child({ module: 'agent' });
const { TOOLS, ejecutarTool } = require('./tools');
const funcionalidadService = require('./services/funcionalidadService');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const MAX_ITERACIONES = 10;

const SYSTEM_PROMPT =
  'Sos KarIA Escobar. Podés ayudar al usuario con todas las funcionalidades que tiene cargadas. ' +
  'Si el usuario necesita algo que no tenés configurado, sugerile que lo agregue desde la sección Funcionalidades del menú.\n\n' +
  'Herramientas disponibles por defecto:\n' +
  '• generar_excel — genera archivos .xlsx con datos tabulares\n' +
  '• generar_word — genera documentos .docx. Soporta tipos formales: oficio, circular, acta, respuesta y general. ' +
  'Usá el tipo correcto según lo que pida el usuario y completá los metadatos del encabezado (número, destinatario, firmante, etc.) con la información que te dé.\n' +
  '• analizar_documento — analiza en profundidad el contenido de un documento ya cargado. Usala cuando el usuario pida resumir, extraer datos, identificar puntos clave o comparar secciones.\n' +
  '• analizar_excel_basico — analiza datos tabulares pasados como texto con totales, promedios y observaciones.\n' +
  '• analizar_excel_avanzado — lee directamente un archivo Excel cargado en esta sesión y calcula estadísticas completas ' +
  'por hoja: suma, promedio, mínimo, máximo en columnas numéricas; valores más frecuentes en columnas de texto. ' +
  'No requiere que el usuario describa las columnas — las detecta automáticamente. ' +
  'Usalo ante cualquier pedido de análisis de un Excel ya subido.\n\n' +
  'Presentaciones (disponible si el usuario conectó Gamma AI desde Integraciones):\n' +
  '• generar_presentacion — genera presentaciones ejecutivas, documentos o páginas web con diseño profesional usando Gamma AI. ' +
  'Aceptá título, descripción del contenido y formato (presentacion / documento / pagina_web). ' +
  'Si la tool devuelve error GAMMA_NOT_CONNECTED, indicale al usuario que conecte Gamma AI desde Integraciones.\n\n' +
  'Búsqueda e investigación:\n' +
  '• buscar_web — busca información actualizada en internet. Usa Perplexity si está conectado desde Integraciones, sino usa búsqueda web integrada de Claude.\n' +
  '• buscar_normativa — busca leyes, decretos, resoluciones y reglamentos en Infoleg y SAIJ. Podés filtrar por organismo.\n' +
  '• buscar_ordenanzas — busca ordenanzas del HCD del Partido de Escobar.\n\n' +
  'Google Workspace (disponible si el usuario conectó su cuenta desde Integraciones):\n' +
  '• leer_gmail — muestra los últimos emails no leídos con remitente, asunto y resumen\n' +
  '• enviar_gmail — envía un email desde la cuenta del usuario; pedí siempre confirmación antes de enviar\n' +
  '• leer_calendar — lista los próximos eventos del calendario con fecha, hora y lugar\n' +
  '• crear_evento — crea un evento en el calendario; confirmá título, fecha y hora antes de crear\n' +
  '• buscar_drive — busca archivos en Google Drive por nombre o contenido y devuelve el link de acceso\n' +
  'Si el usuario pide algo de Google y la tool devuelve error GOOGLE_NOT_CONNECTED, informale que debe conectar ' +
  'su cuenta de Google desde la sección Integraciones del menú lateral.\n\n' +
  'Cuando el usuario comparte un documento, su contenido llegará delimitado entre [INICIO DOCUMENTO] y [FIN DOCUMENTO]. ' +
  'Podés usar analizar_documento para procesarlo con mayor detalle si el usuario hace una consulta específica.\n\n' +
  'Siempre respondé en español argentino. Sé breve en la presentación.';

/**
 * Extrae el texto plano del array de bloques de contenido de Anthropic.
 *
 * @param {Object[]} contenido - content array de la respuesta
 * @returns {string}
 */
function extraerTexto(contenido) {
  return contenido
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Ejecuta el loop del agente Claude con soporte de herramientas.
 *
 * @param {Object} params
 * @param {string} params.mensaje - Mensaje del usuario
 * @param {Object[]} params.historial - Mensajes previos de la conversación
 * @param {string} params.userId - ID del usuario (para logs y auditoría)
 *
 * @returns {Promise<{ respuesta: string, mensajesActualizados: Object[] }>}
 *
 * @throws {AppError} code: 'CLAUDE_UNAVAILABLE' (503)
 * @throws {AppError} code: 'AGENT_LOOP_ERROR' (500)
 */
async function ejecutarAgente({ mensaje, historial, userId }) {
  // Sólo se pasan role y content a Anthropic (limpiar campos extra de Supabase)
  const messages = [
    ...historial.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: mensaje },
  ];

  // System prompt dinámico basado en las funcionalidades activas del usuario.
  // Si no tiene ninguna, se usa SYSTEM_PROMPT como fallback.
  let systemPrompt = SYSTEM_PROMPT;
  try {
    const dinamico = await funcionalidadService.buildSystemPrompt(userId);
    if (dinamico) systemPrompt = dinamico;
  } catch (_) {
    logger.warn('No se pudo cargar system prompt dinámico, usando fallback', { userId });
  }

  let iteraciones = 0;

  try {
    while (iteraciones < MAX_ITERACIONES) {
      iteraciones++;

      // eslint-disable-next-line no-await-in-loop
      const respuesta = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      logger.info('Respuesta de Claude', {
        userId,
        iteracion: iteraciones,
        stop_reason: respuesta.stop_reason,
      });

      if (respuesta.stop_reason === 'end_turn') {
        messages.push({ role: 'assistant', content: respuesta.content });
        return { respuesta: extraerTexto(respuesta.content), mensajesActualizados: messages };
      }

      if (respuesta.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: respuesta.content });

        // Ejecutar cada tool_use y recopilar resultados
        const resultados = await Promise.all(
          respuesta.content
            .filter((b) => b.type === 'tool_use')
            .map(async (b) => {
              try {
                const resultado = await ejecutarTool(b.name, b.input, userId);
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: JSON.stringify(resultado),
                };
              } catch (toolErr) {
                logger.warn('Error ejecutando tool', { tool: b.name, error: toolErr.message });
                return {
                  type: 'tool_result',
                  tool_use_id: b.id,
                  content: `Error: ${toolErr.message}`,
                  is_error: true,
                };
              }
            })
        );

        messages.push({ role: 'user', content: resultados });
        continue;
      }

      // stop_reason inesperado
      break;
    }

    throw new AppError('El agente alcanzó el máximo de iteraciones', 'AGENT_LOOP_ERROR', 500);
  } catch (err) {
    if (err.isOperational) throw err;

    if (err.status === 529 || err.status === 503 || err.status === 502) {
      throw new AppError('Claude no está disponible temporalmente', 'CLAUDE_UNAVAILABLE', 503);
    }

    logger.error('Error en loop del agente', { error: err.message, userId });
    throw new AppError('Error en el loop del agente', 'AGENT_LOOP_ERROR', 500);
  }
}

// eslint-disable-next-line max-len
const SYSTEM_PROMPT_CONFIGURADOR =
  'Sos un asistente especializado en configurar funcionalidades de IA. Tu rol es hacer preguntas guiadas al usuario para entender qué quiere que haga su agente y generar el system prompt perfecto. Preguntá: nombre de la funcionalidad, qué debe hacer, qué NO debe hacer, cómo debe responder (tono, formato), y si necesita alguna herramienta específica. Al final, generá el system prompt entre las etiquetas <system_prompt> y </system_prompt> para que el usuario pueda copiarlo fácilmente. Siempre respondé en español argentino.';

/**
 * Ejecuta una conversación con el agente configurador. Sin herramientas, sin persistencia.
 * El historial lo maneja el frontend en memoria.
 *
 * @param {{ mensaje: string, historial: Array<{role: string, content: string}> }} params
 * @returns {Promise<{ respuesta: string }>}
 */
async function ejecutarAgenteConfigurador({ mensaje, historial }) {
  const messages = [
    ...historial.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: mensaje },
  ];
  try {
    const res = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT_CONFIGURADOR,
      messages,
    });
    return { respuesta: extraerTexto(res.content) };
  } catch (err) {
    if (err.status === 529 || err.status === 503 || err.status === 502) {
      throw new AppError('Claude no está disponible temporalmente', 'CLAUDE_UNAVAILABLE', 503);
    }
    logger.error('Error en agente configurador', { error: err.message });
    throw new AppError('Error en el agente configurador', 'AGENT_LOOP_ERROR', 500);
  }
}

module.exports = { ejecutarAgente, ejecutarAgenteConfigurador };
