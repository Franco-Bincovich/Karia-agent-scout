// hooks/useChat.js
// Maneja el estado del chat: mensajes, conversacionId, loading, error.
// Llama a chatApi.enviar y actualiza el estado con la respuesta.

import { useState, useCallback } from 'react';
import { chatApi, conversacionesApi } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Crea un objeto de mensaje con rol y timestamp.
 * @param {'user'|'agent'} rol
 * @param {string} texto
 */
function crearMensaje(rol, texto) {
  return { id: crypto.randomUUID(), rol, texto, timestamp: new Date() };
}

export function useChat() {
  const { token } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [conversacionId, setConversacionId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = useCallback(
    async (texto) => {
      if (!texto.trim() || cargando) return;

      setMensajes((prev) => [...prev, crearMensaje('user', texto.trim())]);
      setCargando(true);
      setError(null);

      try {
        const data = await chatApi.enviar(texto.trim(), conversacionId, token);
        setMensajes((prev) => [...prev, crearMensaje('agent', data.respuesta)]);

        if (!conversacionId && data.conversacionId) {
          setConversacionId(data.conversacionId);
        }
      } catch (err) {
        const msg = err.message || 'Error al conectar con el servidor';
        setError(msg);
        setMensajes((prev) => [...prev, crearMensaje('agent', `⚠️ ${msg}`)]);
      } finally {
        setCargando(false);
      }
    },
    [token, conversacionId, cargando]
  );

  /**
   * Carga una conversación previa desde el backend.
   * @param {string} id - ID de la conversación a cargar
   */
  const cargarConversacion = useCallback(
    async (id) => {
      if (cargando) return;
      setCargando(true);
      setError(null);

      try {
        const data = await conversacionesApi.cargar(id, token);
        const msgs = (data.mensajes || []).map((m) => ({
          id: m.id || crypto.randomUUID(),
          rol: m.rol,
          texto: m.texto,
          timestamp: new Date(m.timestamp || m.created_at),
        }));
        setMensajes(msgs);
        setConversacionId(id);
      } catch (err) {
        const msg = err.message || 'Error al cargar conversación';
        setError(msg);
      } finally {
        setCargando(false);
      }
    },
    [token, cargando]
  );

  return { mensajes, enviar, cargando, error, cargarConversacion };
}
