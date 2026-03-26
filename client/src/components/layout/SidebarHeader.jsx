// components/layout/SidebarHeader.jsx
// Header del sidebar: botón hamburguesa + isotipo KarIA + texto "karIA Scout".

/**
 * @param {{ expandido: boolean, onToggle: () => void }} props
 */
export default function SidebarHeader({ expandido, onToggle }) {
  return (
    <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={onToggle}
        aria-label={expandido ? 'Colapsar sidebar' : 'Expandir sidebar'}
        style={{
          background: 'transparent', border: 'none', color: 'var(--color-white)',
          fontSize: '22px', cursor: 'pointer', padding: '0.25rem 0.5rem',
          borderRadius: 'var(--border-radius)', transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        ☰
      </button>

      {expandido && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
          {/* Isotipo: cara feliz simple */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="var(--color-teal)" />
            <circle cx="11" cy="13" r="2" fill="var(--color-primary)" />
            <circle cx="21" cy="13" r="2" fill="var(--color-primary)" />
            <path d="M10 20 Q16 26 22 20" stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font)' }}>
            <span style={{ color: 'var(--color-white)' }}>kar</span>
            <span style={{ color: 'var(--color-teal)' }}>IA</span>
            <span style={{ color: 'var(--color-white)' }}> Escobar</span>
          </span>
        </div>
      )}
    </div>
  );
}
