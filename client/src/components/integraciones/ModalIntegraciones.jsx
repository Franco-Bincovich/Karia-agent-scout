// components/integraciones/ModalIntegraciones.jsx
// Contenedor del modal de integraciones. Delega el contenido a secciones especializadas.

import ApiKeySection from './ApiKeySection';
import GoogleOAuthSection from './GoogleOAuthSection';

/**
 * @param {{ token: string, onClose: () => void, onConectado: () => void }} props
 */
export default function ModalIntegraciones({ token, onClose, onConectado }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,28,84,0.55)', zIndex: 1000 }}
      />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: 'var(--color-white)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(8,28,84,0.18)', fontFamily: 'var(--font)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>🔌 Agregar integración</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-gris)', lineHeight: 1 }}>✕</button>
        </div>

        <ApiKeySection token={token} onConectado={onConectado} />

        <div style={{ borderTop: '1px solid var(--color-bg)', margin: '1rem 0' }} />

        <GoogleOAuthSection token={token} />

      </div>
    </>
  );
}
