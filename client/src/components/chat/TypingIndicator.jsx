// components/chat/TypingIndicator.jsx
// Tres puntos animados (bounce) dentro de una burbuja gris estilo agente.
// Incluye avatar KarIA a la izquierda, idéntico a MessageBubble.

const keyframes = `
@keyframes karia-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%            { transform: translateY(-5px); }
}`;

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

export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: '6px',
      padding: '0 0.75rem', marginBottom: '0.4rem',
    }}>
      <style>{keyframes}</style>
      {avatar}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '0.45rem 0.7rem',
        background: '#f0f0f0',
        borderRadius: '18px 18px 18px 4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block', width: '7px', height: '7px',
              borderRadius: '50%', background: 'var(--color-gris)',
              animation: `karia-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
