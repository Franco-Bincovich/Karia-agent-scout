// hooks/useChat.js
// Maneja el estado del chat: mensajes, conversacionId, loading, error.
// Llama a chatApi.enviar y actualiza el estado con la respuesta.

import { useState, useCallback, useRef } from 'react';
import { chatApi, conversacionesApi, uploadDocumento } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Crea un objeto de mensaje con role y content (formato canónico del frontend).
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
function crearMensaje(role, content) {
  return { id: crypto.randomUUID(), role, content, timestamp: new Date() };
}

export function useChat() {
  const { token } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [conversacionId, setConversacionId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Ref para evitar dependencia de `cargando` en los callbacks y prevenir stale closures
  const cargandoRef = useRef(false);
  const conversacionIdRef = useRef(null);

  function setCargandoSync(val) {
    cargandoRef.current = val;
    setCargando(val);
  }

  function setConversacionIdSync(val) {
    conversacionIdRef.current = val;
    setConversacionId(val);
  }

  const nuevaConversacion = useCallback(() => {
    setMensajes([]);
    setConversacionIdSync(null);
    setError(null);
  }, []);

  const enviar = useCallback(
    async (texto) => {
      if (!texto.trim() || cargandoRef.current) return;

      setMensajes((prev) => [...prev, crearMensaje('user', texto.trim())]);
      setCargandoSync(true);
      setError(null);

      try {
        const data = await chatApi.enviar(texto.trim(), conversacionIdRef.current, token);
        setMensajes((prev) => [...prev, crearMensaje('assistant', data.respuesta)]);

        if (!conversacionIdRef.current && data.conversacionId) {
          setConversacionIdSync(data.conversacionId);
        }
      } catch (err) {
        const msg = err.message || 'Error al conectar con el servidor';
        setError(msg);
        setMensajes((prev) => [...prev, crearMensaje('assistant', `⚠️ ${msg}`)]);
      } finally {
        setCargandoSync(false);
      }
    },
    [token]
  );

  /**
   * Carga una conversación previa desde el backend y la muestra en el chat.
   * @param {string} id - UUID de la conversación
   */
  const cargarConversacion = useCallback(
    async (id) => {
      if (cargandoRef.current) return;
      setCargandoSync(true);
      setError(null);

      try {
        const data = await conversacionesApi.cargar(id, token);
        const msgs = (data.mensajes || []).map((m) => ({
          id: m.id || crypto.randomUUID(),
          role: m.rol === 'agent' ? 'assistant' : 'user',
          content: m.texto,
          timestamp: new Date(m.timestamp || m.created_at),
        }));
        setMensajes(msgs);
        setConversacionIdSync(id);
      } catch (err) {
        const msg = err.message || 'Error al cargar conversación';
        setError(msg);
      } finally {
        setCargandoSync(false);
      }
    },
    [token]
  );

  /**
   * Sube un archivo, formatea el mensaje con el contenido y lo envía al agente.
   * @param {File} archivo
   */
  const subirDocumento = useCallback(
    async (archivo) => {
      if (cargandoRef.current) return;
      setCargandoSync(true);
      setError(null);

      try {
        const { nombreArchivo, tipo, truncado, texto: contenido } = await uploadDocumento(archivo, token);

        let msg =
          `📎 Documento: ${nombreArchivo} (${tipo})\n\n` +
          `[INICIO DOCUMENTO]\n${contenido}\n[FIN DOCUMENTO]\n\n` +
          `¿Qué querés hacer con este documento?`;

        if (truncado) {
          msg += '\n\n⚠️ El documento fue truncado a 80.000 caracteres por exceder el límite permitido.';
        }

        setMensajes((prev) => [...prev, crearMensaje('user', msg)]);

        const data = await chatApi.enviar(msg, conversacionIdRef.current, token);
        setMensajes((prev) => [...prev, crearMensaje('assistant', data.respuesta)]);

        if (!conversacionIdRef.current && data.conversacionId) {
          setConversacionIdSync(data.conversacionId);
        }
      } catch (err) {
        const msg = err.message || 'Error al procesar el documento';
        setError(msg);
        setMensajes((prev) => [...prev, crearMensaje('assistant', `⚠️ ${msg}`)]);
      } finally {
        setCargandoSync(false);
      }
    },
    [token]
  );

  return { mensajes, enviar, cargando, error, cargarConversacion, nuevaConversacion, subirDocumento };
}
