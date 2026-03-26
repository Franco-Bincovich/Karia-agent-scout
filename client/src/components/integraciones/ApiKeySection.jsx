// components/integraciones/ApiKeySection.jsx
// Sección de conexión de API keys (OpenAI, Perplexity, Gamma).

import { useState } from 'react';
import { integracionesApi } from '../../services/api';

const APIKEY_INTEGRACIONES = [
  { tipo: 'openai',     nombre: 'OpenAI',     icono: '🧠', placeholder: 'sk-proj-...',       nota: '' },
  { tipo: 'perplexity', nombre: 'Perplexity', icono: '🔍', placeholder: 'pplx-...',          nota: '' },
  { tipo: 'gamma',      nombre: 'Gamma AI',   icono: '🎨', placeholder: 'gamma-api-key-...', nota: 'Obtené tu API key en gamma.app' },
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
 * @param {{ token: string, onConectado: () => void }} props
 */
export default function ApiKeySection({ token, onConectado }) {
  return (
    <>
      {APIKEY_INTEGRACIONES.map((integ) => (
        <ApiKeyRow key={integ.tipo} integ={integ} token={token} onConectado={onConectado} />
      ))}
    </>
  );
}
