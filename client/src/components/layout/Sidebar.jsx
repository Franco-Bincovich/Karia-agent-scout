// components/layout/Sidebar.jsx
// Sidebar colapsable con tres secciones accordion.
// Expandido: 260px con labels. Colapsado: 64px solo íconos.

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SidebarHeader from './SidebarHeader';
import SidebarHistory from './SidebarHistory';
import SidebarIntegraciones from './SidebarIntegraciones';
import SidebarFuncionalidades from './SidebarFuncionalidades';

const SECTION_BTN = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  width: '100%', padding: '0.5rem 0.75rem',
  background: 'transparent', border: 'none',
  color: 'var(--color-gris)', fontSize: '11px', fontFamily: 'var(--font)',
  fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase',
  cursor: 'pointer', borderRadius: 'var(--border-radius)',
  transition: 'background 0.2s',
};

const NAV_BTN = {
  display: 'flex', alignItems: 'center', gap: '0.6rem',
  padding: '0.45rem 1rem', cursor: 'pointer',
  borderRadius: 'var(--border-radius)', transition: 'background 0.2s',
  border: 'none', background: 'transparent', width: '100%',
  color: 'var(--color-white)', fontSize: '13px', fontFamily: 'var(--font)',
  textAlign: 'left',
};

function AccordionSection({ titulo, icono, abierto, onToggle, expandido, children }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.1rem' }}>
      <button
        onClick={onToggle}
        style={{ ...SECTION_BTN, justifyContent: expandido ? 'space-between' : 'center' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        title={titulo}
      >
        {expandido ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '14px' }}>{icono}</span>
              {titulo}
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>{abierto ? '▾' : '▸'}</span>
          </>
        ) : (
          <span style={{ fontSize: '16px' }}>{icono}</span>
        )}
      </button>
      {expandido && abierto && (
        <div style={{ paddingBottom: '0.25rem' }}>{children}</div>
      )}
    </div>
  );
}

/**
 * @param {{ onSeleccionarConversacion: (id: string) => void, onLogout: () => void }} props
 */
export default function Sidebar({ onSeleccionarConversacion, onLogout }) {
  const [expandido, setExpandido] = useState(true);
  const [abrFuncionalidades, setAbrFuncionalidades] = useState(true);
  const [abrConversaciones, setAbrConversaciones] = useState(true);
  const [abrIntegraciones, setAbrIntegraciones] = useState(false);
  const [abrPerfil, setAbrPerfil] = useState(false);
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

      {/* Secciones accordion */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>

        <AccordionSection titulo="FUNCIONALIDADES" icono="📄"
          abierto={abrFuncionalidades} onToggle={() => setAbrFuncionalidades((v) => !v)}
          expandido={expandido}
        >
          <SidebarFuncionalidades token={token} />
        </AccordionSection>

        <AccordionSection titulo="CONVERSACIONES" icono="💬"
          abierto={abrConversaciones} onToggle={() => setAbrConversaciones((v) => !v)}
          expandido={expandido}
        >
          <SidebarHistory token={token} onSeleccionar={onSeleccionarConversacion} />
        </AccordionSection>

        <AccordionSection titulo="INTEGRACIONES" icono="🔌"
          abierto={abrIntegraciones} onToggle={() => setAbrIntegraciones((v) => !v)}
          expandido={expandido}
        >
          <SidebarIntegraciones token={token} />
        </AccordionSection>

        <AccordionSection titulo="PERFIL" icono="👤"
          abierto={abrPerfil} onToggle={() => setAbrPerfil((v) => !v)}
          expandido={expandido}
        >
          {expandido && (
            <div style={{ padding: '0.4rem 1rem 0.6rem' }}>
              {/* Nombre y rol */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-teal)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: '#0a1628', fontWeight: 700,
                }}>
                  {(user?.nombre || user?.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-white)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.nombre || user?.email || 'Usuario'}
                  </div>
                  <span style={{
                    display: 'inline-block', marginTop: '2px',
                    padding: '1px 6px', borderRadius: '4px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
                    background: user?.rol === 'admin' ? 'rgba(251,191,36,0.2)' : 'rgba(67,209,201,0.15)',
                    color: user?.rol === 'admin' ? '#fbbf24' : 'var(--color-teal)',
                    textTransform: 'uppercase',
                  }}>
                    {user?.rol || 'analista'}
                  </span>
                </div>
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={onLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  width: '100%', padding: '0.4rem 0.5rem',
                  background: 'transparent', border: 'none',
                  color: 'var(--color-gris)', fontSize: '13px', fontFamily: 'var(--font)',
                  borderRadius: 'var(--border-radius)', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'var(--color-error)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-gris)'; }}
              >
                <span>🚪</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </AccordionSection>

      </div>
    </aside>
  );
}
