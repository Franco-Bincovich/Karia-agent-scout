// components/chat/ChatInput.jsx
// Input compacto estilo WhatsApp — borde pill, botón circular teal.

import { useRef, useState } from 'react';

const ACCEPT = '.pdf,.xlsx,.xls,.docx,.csv,.txt';

export default function ChatInput({ onEnviar, onSubirArchivo, cargando }) {
  const [texto, setTexto] = useState('');
  const [focused, setFocused] = useState(false);
  const fileRef = useRef(null);

  const ocupado = cargando;
  const activo = !ocupado && texto.trim();

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = texto.trim();
    if (!trimmed || ocupado) return;
    onEnviar(trimmed);
    setTexto('');
  }

  function handleArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo || !onSubirArchivo) return;
    onSubirArchivo(archivo);
  }

  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'center',
      padding: '0.5rem 0.75rem',
      background: 'var(--color-white)',
      borderTop: '1px solid #e5e5e5',
    }}>
      {/* Botón adjuntar */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={handleArchivo}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={ocupado}
        aria-label="Adjuntar documento"
        title="Adjuntar documento"
        style={{
          width: '36px', height: '36px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid #e0e0e0', borderRadius: '50%',
          cursor: ocupado ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => { if (!ocupado) e.currentTarget.style.borderColor = 'var(--color-teal)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
      >
        {ocupado ? (
          <span style={{
            width: '14px', height: '14px',
            border: '2px solid #e0e0e0',
            borderTopColor: 'var(--color-teal)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"
              stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Escribí un mensaje..."
        rows={1}
        disabled={ocupado}
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
          opacity: ocupado ? 0.6 : 1,
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
