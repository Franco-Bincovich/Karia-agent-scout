// components/chat/MessageBubble.jsx
// Burbuja estilo WhatsApp — compacta, limpia y legible.
// Usuario: derecha, fondo #081c54. Agente: izquierda con avatar KarIA.

import ReactMarkdown from 'react-markdown';
import BubbleActions from './BubbleActions';

function formatHora(date) {
  return date instanceof Date
    ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '';
}

const avatar = (
  <div style={{
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="13" r="2.5" fill="var(--color-primary)" />
      <circle cx="21" cy="13" r="2.5" fill="var(--color-primary)" />
      <path d="M10 20 Q16 26 22 20" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);

const mdComponents = {
  pre: ({ children }) => (
    <pre style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '6px', padding: '0.4rem 0.6rem', overflowX: 'auto', fontSize: '12px' }}>
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '3px', padding: '1px 3px', fontSize: '12px' }}>
      {children}
    </code>
  ),
  p: ({ children }) => <p style={{ marginBottom: '0.3rem' }}>{children}</p>,
};

export default function MessageBubble({ mensaje }) {
  const esUsuario = mensaje.role === 'user';
  const texto = typeof mensaje.content === 'string' ? mensaje.content : '';

  return (
    <div style={{
      display: 'flex', justifyContent: esUsuario ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end', gap: '6px',
      marginBottom: '0.4rem', padding: '0 0.75rem',
    }}>
      {!esUsuario && avatar}
      <div style={{
        maxWidth: '68%', padding: '0.45rem 0.7rem',
        borderRadius: esUsuario ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: esUsuario ? 'var(--color-primary)' : '#f0f0f0',
        color: esUsuario ? '#fff' : 'var(--color-text)',
        fontSize: 'var(--chat-font-size)', lineHeight: '1.5',
        fontFamily: 'var(--font)', wordBreak: 'break-word',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}>
        {esUsuario ? (
          <span>{texto}</span>
        ) : (
          <>
            <ReactMarkdown components={mdComponents}>{texto}</ReactMarkdown>
            <BubbleActions texto={texto} />
          </>
        )}
        <div style={{
          fontSize: '10px', marginTop: '0.2rem',
          textAlign: esUsuario ? 'right' : 'left',
          color: esUsuario ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)',
        }}>
          {formatHora(mensaje.timestamp)}
        </div>
      </div>
    </div>
  );
}
