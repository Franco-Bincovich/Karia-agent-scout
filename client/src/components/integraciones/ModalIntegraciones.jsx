// components/integraciones/ModalIntegraciones.jsx
// Modal para conectar integraciones. API key: OpenAI. OAuth Google: servicios seleccionables.

import { useState } from 'react';
import { apiFetch, integracionesApi } from '../../services/api';

const APIKEY_INTEGRACIONES = [
  { tipo: 'openai',      nombre: 'OpenAI',      icono: '🧠', placeholder: 'sk-proj-...',          nota: '' },
  { tipo: 'perplexity',  nombre: 'Perplexity',  icono: '🔍', placeholder: 'pplx-...',             nota: '' },
  { tipo: 'gamma',       nombre: 'Gamma AI',    icono: '🎨', placeholder: 'gamma-api-key-...',     nota: 'Obtené tu API key en gamma.app' },
];

const REDIRECT_URL = 'http://localhost:3003/api/integraciones/google/callback';

const SERVICIOS_GOOGLE = [
  { k: 'gmail',    label: '📧 Gmail' },
  { k: 'drive',   label: '💾 Google Drive' },
  { k: 'calendar', label: '📅 Google Calendar' },
];

function ApiKeyRow({ integ, token, onConectado }) {
  const [apiKey, setApiKey] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function conectar() {
    if (!apiKey.trim()) return;
    setCargando(true); setError('');
    try {
      await integracionesApi.conectarApiKey(integ.tipo, apiKey.trim(), token);
      onConectado();
    } catch (err) {
      setError(err.message || 'Error al conectar');
      setCargando(false);
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '18px' }}>{integ.icono}</span>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{integ.nombre}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={integ.placeholder}
          onKeyDown={(e) => e.key === 'Enter' && conectar()}
          style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '13px', border: '1.5px solid var(--color-gris)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font)', outline: 'none', color: 'var(--color-text)' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--color-teal)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--color-gris)'; }}
        />
        <button
          onClick={conectar}
          disabled={cargando || !apiKey.trim()}
          style={{ padding: '0.55rem 1rem', background: 'var(--color-teal)', color: 'var(--color-primary)', border: 'none', borderRadius: 'var(--border-radius)', fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font)', cursor: cargando ? 'not-allowed' : 'pointer', opacity: !apiKey.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
        >
          {cargando ? '...' : 'Conectar'}
        </button>
      </div>
      {error && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '0.3rem' }}>{error}</p>}
      {integ.nota && <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>{integ.nota}</p>}
    </div>
  );
}

/**
 * @param {{ token: string, onClose: () => void, onConectado: () => void }} props
 */
export default function ModalIntegraciones({ token, onClose, onConectado }) {
  const [servicios, setServicios] = useState({ gmail: false, drive: false, calendar: false });
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [errorGoogle, setErrorGoogle] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [configAvanzada, setConfigAvanzada] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const seleccionados = Object.keys(servicios).filter((k) => servicios[k]);

  function toggleServicio(k) { setServicios((prev) => ({ ...prev, [k]: !prev[k] })); }

  async function copiarUrl() {
    await navigator.clipboard.writeText(REDIRECT_URL);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function conectarGoogle() {
    setCargandoGoogle(true); setErrorGoogle('');
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
      setErrorGoogle(err.message || 'Error al iniciar OAuth');
      setCargandoGoogle(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,28,84,0.55)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: 'var(--color-white)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(8,28,84,0.18)', fontFamily: 'var(--font)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>🔌 Agregar integración</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-gris)', lineHeight: 1 }}>✕</button>
        </div>

        {APIKEY_INTEGRACIONES.map((integ) => (
          <ApiKeyRow key={integ.tipo} integ={integ} token={token} onConectado={onConectado} />
        ))}

        <div style={{ borderTop: '1px solid var(--color-bg)', margin: '1rem 0' }} />

        {/* Google */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '18px' }}>🔑</span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>Google</span>
          </div>

          {/* Redirect URL info */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius)', padding: '0.65rem 0.75rem', marginBottom: '0.85rem' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
              Antes de conectar, agregá esta URL en Google Cloud Console como URI de redireccionamiento autorizado:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <code style={{ flex: 1, fontSize: '11px', color: 'var(--color-primary)', wordBreak: 'break-all' }}>{REDIRECT_URL}</code>
              <button
                onClick={copiarUrl}
                style={{ background: copiado ? 'var(--color-teal)' : 'var(--color-white)', border: '1px solid var(--color-gris)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', color: copiado ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font)', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
              >
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Configuración avanzada */}
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

          {/* Checkboxes */}
          {SERVICIOS_GOOGLE.map(({ k, label }) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
              <input type="checkbox" checked={servicios[k]} onChange={() => toggleServicio(k)} style={{ accentColor: 'var(--color-teal)', width: '15px', height: '15px', cursor: 'pointer' }} />
              {label}
            </label>
          ))}

          {seleccionados.length > 0 && (
            <button
              onClick={conectarGoogle}
              disabled={cargandoGoogle}
              style={{ marginTop: '0.65rem', width: '100%', padding: '0.6rem', background: 'var(--color-primary)', color: 'var(--color-white)', border: 'none', borderRadius: 'var(--border-radius)', fontWeight: 600, fontSize: '14px', fontFamily: 'var(--font)', cursor: cargandoGoogle ? 'not-allowed' : 'pointer' }}
            >
              {cargandoGoogle ? 'Redirigiendo...' : 'Conectar con Google ↗'}
            </button>
          )}
          {errorGoogle && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '0.4rem' }}>{errorGoogle}</p>}
        </div>
      </div>
    </>
  );
}
