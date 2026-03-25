// components/chat/ChatInput.jsx
// Input compacto estilo WhatsApp — borde pill, botón circular teal.

import { useState } from 'react';

export default function ChatInput({ onEnviar, cargando }) {
  const [texto, setTexto] = useState('');
  const [focused, setFocused] = useState(false);
  const activo = !cargando && texto.trim();

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = texto.trim();
    if (!trimmed || cargando) return;
    onEnviar(trimmed);
    setTexto('');
  }

  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'center',
      padding: '0.5rem 0.75rem',
      background: 'var(--color-white)',
      borderTop: '1px solid #e5e5e5',
    }}>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Escribí un mensaje..."
        rows={1}
        style={{
          flex: 1, resize: 'none', height: '44px',
          padding: '0.6rem 1rem',
          border: `1.5px solid ${focused ? 'var(--color-teal)' : '#e0e0e0'}`,
          borderRadius: '22px',
          fontFamily: 'var(--font)', fontSize: 'var(--chat-font-size)',
          outline: 'none', lineHeight: '1.5',
          maxHeight: '88px', overflowY: 'auto',
          transition: 'border-color 0.2s',
          color: 'var(--color-text)',
        }}
      />
      <button
        onClick={submit}
        disabled={!activo}
        aria-label="Enviar mensaje"
        style={{
          width: '40px', height: '40px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: activo ? 'var(--color-teal)' : '#e0e0e0',
          border: 'none', borderRadius: '50%',
          cursor: activo ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseEnter={(e) => { if (activo) e.currentTarget.style.background = '#38bfb7'; }}
        onMouseLeave={(e) => { if (activo) e.currentTarget.style.background = 'var(--color-teal)'; }}
        onMouseDown={(e) => { if (activo) e.currentTarget.style.transform = 'scale(0.93)'; }}
        onMouseUp={(e) => { if (activo) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 5l7 7-7 7" stroke={activo ? '#fff' : '#aaa'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
