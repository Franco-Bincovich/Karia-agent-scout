// components/layout/SidebarHistory.jsx
// Lista de conversaciones previas del usuario (últimas 10).

import { useState, useEffect } from 'react';
import { conversacionesApi } from '../../services/api';

/**
 * @param {{ expandido: boolean, token: string|null, onSeleccionar: (id: string) => void }} props
 */
export default function SidebarHistory({ expandido, token, onSeleccionar }) {
  const [conversaciones, setConversaciones] = useState([]);

  useEffect(() => {
    if (!token) return;
    conversacionesApi.listar(token)
      .then((data) => setConversaciones((data.conversaciones || []).slice(0, 10)))
      .catch(() => setConversaciones([]));
  }, [token]);

  if (!expandido) {
    return (
      <div style={{ padding: '0.75rem 0', textAlign: 'center' }}>
        <span style={{ fontSize: '18px', color: 'var(--color-gris)' }}>💬</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ color: 'var(--color-gris)', fontSize: '11px', padding: '0.25rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Historial
      </div>
      {conversaciones.length === 0 && (
        <div style={{ color: 'var(--color-gris)', fontSize: '13px', padding: '0.5rem' }}>
          Sin conversaciones previas
        </div>
      )}
      {conversaciones.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSeleccionar(conv.id)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '0.5rem 0.5rem', background: 'transparent', border: 'none',
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
