// components/layout/SidebarHistory.jsx
// Lista de conversaciones previas (últimas 10), usada dentro del accordion CONVERSACIONES.

import { useState, useEffect } from 'react';
import { conversacionesApi } from '../../services/api';

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function tituloValido(conv) {
  if (!conv.titulo) return false;
  if (RE_UUID.test(conv.titulo)) return false;
  return true;
}

/**
 * @param {{ token: string|null, onSeleccionar: (id: string) => void }} props
 */
export default function SidebarHistory({ token, onSeleccionar }) {
  const [conversaciones, setConversaciones] = useState([]);

  useEffect(() => {
    if (!token) return;
    conversacionesApi.listar(token)
      .then((data) => setConversaciones(
        (data.conversaciones || []).filter(tituloValido).slice(0, 10)
      ))
      .catch(() => setConversaciones([]));
  }, [token]);

  if (conversaciones.length === 0) return null;

  return (
    <div>
      {conversaciones.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSeleccionar(conv.id)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '0.45rem 1rem', background: 'transparent', border: 'none',
            color: 'var(--color-white)', fontSize: '13px', fontFamily: 'var(--font)',
            borderRadius: 'var(--border-radius)', cursor: 'pointer',
            transition: 'background 0.2s', overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title={conv.titulo || conv.resumen || `Conversación ${conv.id.slice(0, 8)}`}
        >
          💬 {conv.titulo || conv.resumen || `Conversación ${conv.id.slice(0, 8)}`}
        </button>
      ))}
    </div>
  );
}
