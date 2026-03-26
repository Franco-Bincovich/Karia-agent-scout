// components/integraciones/GoogleOAuthSection.jsx
// Sección de conexión OAuth2 de Google (Gmail, Drive, Calendar).

import { useState } from 'react';
import { apiFetch } from '../../services/api';

const REDIRECT_URI = `${window.location.protocol}//${window.location.hostname}:3003/api/integraciones/google/callback`;

const SERVICIOS_GOOGLE = [
  { k: 'gmail',    label: '📧 Gmail' },
  { k: 'drive',    label: '💾 Google Drive' },
  { k: 'calendar', label: '📅 Google Calendar' },
];

/**
 * @param {{ token: string }} props
 */
export default function GoogleOAuthSection({ token }) {
  const [servicios, setServicios] = useState({ gmail: false, drive: false, calendar: false });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [configAvanzada, setConfigAvanzada] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const seleccionados = Object.keys(servicios).filter((k) => servicios[k]);

  function toggleServicio(k) { setServicios((prev) => ({ ...prev, [k]: !prev[k] })); }

  async function copiarUrl() {
    await navigator.clipboard.writeText(REDIRECT_URI);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function conectarGoogle() {
    setCargando(true); setError('');
    try {
      const payload = { servicios: seleccionados.join(',') };
      if (clientId.trim()) payload.clientId = clientId.trim();
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
      const { url } = await apiFetch('/api/integraciones/google/auth', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Error al iniciar OAuth');
      setCargando(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '18px' }}>🔑</span>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>Google</span>
      </div>

      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius)', padding: '0.65rem 0.75rem', marginBottom: '0.85rem' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
          Antes de conectar, agregá esta URL en Google Cloud Console como URI de redireccionamiento autorizado:
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <code style={{ flex: 1, fontSize: '11px', color: 'var(--color-primary)', wordBreak: 'break-all' }}>{REDIRECT_URI}</code>
          <button
            onClick={copiarUrl}
            style={{ background: copiado ? 'var(--color-teal)' : 'var(--color-white)', border: '1px solid var(--color-gris)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', color: copiado ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font)', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
          >
            {copiado ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={() => setConfigAvanzada((v) => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font)', fontWeight: 600 }}
        >
          <span style={{ fontSize: '10px' }}>{configAvanzada ? '▾' : '▸'}</span>
          Configuración avanzada
        </button>

        {configAvanzada && (
          <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Tu Client ID de Google Cloud Console"
              style={{ padding: '0.5rem 0.7rem', fontSize: '13px', border: '1.5px solid var(--color-gris)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font)', outline: 'none', color: 'var(--color-text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-gris)'; }}
            />
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Tu Client Secret"
              style={{ padding: '0.5rem 0.7rem', fontSize: '13px', border: '1.5px solid var(--color-gris)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font)', outline: 'none', color: 'var(--color-text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-gris)'; }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Obtené estas credenciales creando una app en Google Cloud Console en{' '}
              <span style={{ color: 'var(--color-teal)' }}>console.cloud.google.com</span>.
              Habilitá las APIs de Gmail, Drive y Calendar.
            </p>
          </div>
        )}
      </div>

      {SERVICIOS_GOOGLE.map(({ k, label }) => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
          <input type="checkbox" checked={servicios[k]} onChange={() => toggleServicio(k)} style={{ accentColor: 'var(--color-teal)', width: '15px', height: '15px', cursor: 'pointer' }} />
          {label}
        </label>
      ))}

      {seleccionados.length > 0 && (
        <button
          onClick={conectarGoogle}
          disabled={cargando}
          style={{ marginTop: '0.65rem', width: '100%', padding: '0.6rem', background: 'var(--color-primary)', color: 'var(--color-white)', border: 'none', borderRadius: 'var(--border-radius)', fontWeight: 600, fontSize: '14px', fontFamily: 'var(--font)', cursor: cargando ? 'not-allowed' : 'pointer' }}
        >
          {cargando ? 'Redirigiendo...' : 'Conectar con Google ↗'}
        </button>
      )}
      {error && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '0.4rem' }}>{error}</p>}
    </div>
  );
}
