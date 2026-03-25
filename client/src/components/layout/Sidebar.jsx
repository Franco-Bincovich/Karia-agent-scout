// components/layout/Sidebar.jsx
// Sidebar colapsable estilo WhatsApp Web.
// Expandido: 260px con íconos + labels. Colapsado: 64px solo íconos.

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SidebarHeader from './SidebarHeader';
import SidebarProfile from './SidebarProfile';
import SidebarNav from './SidebarNav';
import SidebarHistory from './SidebarHistory';

/**
 * @param {{ onSeleccionarConversacion: (id: string) => void, onLogout: () => void }} props
 */
export default function Sidebar({ onSeleccionarConversacion, onLogout }) {
  const [expandido, setExpandido] = useState(true);
  const { user, token } = useAuth();

  const ancho = expandido ? '260px' : '64px';

  return (
    <aside
      style={{
        width: ancho, minWidth: ancho, height: '100vh',
        background: 'var(--color-primary)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      <SidebarHeader expandido={expandido} onToggle={() => setExpandido((v) => !v)} />
      <SidebarProfile user={user} expandido={expandido} />
      <SidebarNav expandido={expandido} />
      <SidebarHistory expandido={expandido} token={token} onSeleccionar={onSeleccionarConversacion} />

      {/* Botón cerrar sesión al fondo */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            justifyContent: expandido ? 'flex-start' : 'center',
            width: '100%', padding: '0.5rem 1rem',
            background: 'transparent', border: 'none',
            color: 'var(--color-gris)', fontSize: '14px', fontFamily: 'var(--font)',
            borderRadius: 'var(--border-radius)', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'var(--color-error)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-gris)'; }}
          title="Cerrar sesión"
        >
          <span style={{ fontSize: '18px' }}>🚪</span>
          {expandido && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
