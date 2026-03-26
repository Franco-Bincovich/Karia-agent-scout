// components/layout/SidebarIntegraciones.jsx
// Lista de integraciones conectadas + botón para abrir el modal.
// Detecta ?connected=google al montar para refrescar tras OAuth.

import { useState, useEffect } from 'react';
import { integracionesApi } from '../../services/api';
import ModalIntegraciones from '../integraciones/ModalIntegraciones';

const ICONOS  = { anthropic: '🤖', openai: '🧠', gmail: '📧', drive: '💾', calendar: '📅' };
const NOMBRES = { anthropic: 'Anthropic', openai: 'OpenAI', gmail: 'Gmail', drive: 'Drive', calendar: 'Calendar' };

const BADGE = {
  background: '#16a34a', color: '#fff',
  fontSize: '9px', padding: '1px 6px',
  borderRadius: '99px', flexShrink: 0,
};

/**
 * @param {{ token: string|null }} props
 */
export default function SidebarIntegraciones({ token }) {
  const [integraciones, setIntegraciones] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargar() {
    if (!token) return;
    try {
      const data = await integracionesApi.listar(token);
      setIntegraciones(data.integraciones || []);
    } catch (_) {
      setIntegraciones([]);
    }
  }

  // Limpiar param ?connected=google tras retorno de OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'google') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { cargar(); }, [token]);

  async function desconectar(tipo) {
    try {
      await integracionesApi.desconectar(tipo, token);
      setIntegraciones((prev) => prev.filter((i) => i.tipo !== tipo));
    } catch (_) {}
  }

  return (
    <>
      {/* Anthropic: siempre conectado, configurado desde el servidor */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0.3rem 0.75rem', gap: '0.35rem' }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>🤖</span>
        <span style={{ fontSize: '12px', color: 'var(--color-white)', flex: 1 }}>Anthropic</span>
        <span style={BADGE}>Conectado</span>
      </div>

      {integraciones.map((integ) => (
        <div
          key={integ.tipo}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.75rem', gap: '0.4rem' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', flex: 1 }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{ICONOS[integ.tipo]}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {NOMBRES[integ.tipo]}
            </span>
            <span style={BADGE}>Conectado</span>
          </span>
          <button
            onClick={() => desconectar(integ.tipo)}
            title="Desconectar"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-gris)', fontSize: '13px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', flexShrink: 0, fontFamily: 'var(--font)', lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-gris)'; }}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        onClick={() => setModalAbierto(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 1rem', cursor: 'pointer', borderRadius: 'var(--border-radius)', transition: 'background 0.2s', border: 'none', background: 'transparent', width: '100%', color: 'var(--color-teal)', fontSize: '13px', fontFamily: 'var(--font)', textAlign: 'left' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: '14px' }}>＋</span>
        <span>Agregar integración</span>
      </button>

      {modalAbierto && (
        <ModalIntegraciones
          token={token}
          onClose={() => setModalAbierto(false)}
          onConectado={() => { cargar(); setModalAbierto(false); }}
        />
      )}
    </>
  );
}
