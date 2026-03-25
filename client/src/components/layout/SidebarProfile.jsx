// components/layout/SidebarProfile.jsx
// Sección de perfil del sidebar: avatar con iniciales + nombre + rol.

/**
 * Obtiene las iniciales del nombre del usuario (máx. 2 letras).
 * @param {string} nombre
 */
function getIniciales(nombre) {
  if (!nombre) return '??';
  return nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const avatarStyle = {
  width: '36px', height: '36px', borderRadius: '50%',
  background: 'var(--color-teal)', color: 'var(--color-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '14px', fontWeight: 600, flexShrink: 0,
};

/**
 * @param {{ user: { nombre?: string, rol?: string } | null, expandido: boolean }} props
 */
export default function SidebarProfile({ user, expandido }) {
  const nombre = user?.nombre || 'Usuario';
  const rol = user?.rol || 'Vendedor';

  return (
    <div style={{
      padding: expandido ? '0.75rem 1rem' : '0.75rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      justifyContent: expandido ? 'flex-start' : 'center',
    }}>
      <div style={avatarStyle}>{getIniciales(nombre)}</div>
      {expandido && (
        <div style={{ overflow: 'hidden' }}>
          <div style={{ color: 'var(--color-white)', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {nombre}
          </div>
          <div style={{ color: 'var(--color-gris)', fontSize: '12px' }}>{rol}</div>
        </div>
      )}
    </div>
  );
}
