// components/layout/SidebarNav.jsx
// Accesos rápidos del sidebar con ícono + label.

const items = [
  { icono: '🔍', label: 'Buscar precios', id: 'buscar' },
  { icono: '📧', label: 'Gmail', id: 'gmail' },
  { icono: '📅', label: 'Calendario', id: 'calendario' },
  { icono: '📊', label: 'Reportes', id: 'reportes' },
  { icono: '👥', label: 'Contactos', id: 'contactos' },
];

const itemBase = {
  display: 'flex', alignItems: 'center', gap: '0.6rem',
  padding: '0.5rem 1rem', cursor: 'pointer',
  borderRadius: 'var(--border-radius)', transition: 'background 0.2s',
  border: 'none', background: 'transparent', width: '100%',
  color: 'var(--color-white)', fontSize: '14px', fontFamily: 'var(--font)',
};

/**
 * @param {{ expandido: boolean }} props
 */
export default function SidebarNav({ expandido }) {
  return (
    <nav style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {items.map((item) => (
        <button
          key={item.id}
          style={{ ...itemBase, justifyContent: expandido ? 'flex-start' : 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title={item.label}
        >
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icono}</span>
          {expandido && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}
