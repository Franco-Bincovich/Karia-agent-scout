// pages/CrearFuncionalidad.jsx
// Pantalla de creación de funcionalidades: formulario (40%) + chat configurador (60%).

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { funcionalidadesApi, chatConfiguradorApi } from '../services/api';

const COL_IZQUIERDA = {
  width: '40%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '2rem',
  background: '#ffffff',
  borderRight: '1px solid #e0e0e0',
  boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
  overflowY: 'auto',
};

const COL_DERECHA = {
  width: '60%',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#ffffff',
  boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
};

const LABEL = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  color: '#081c54',
  marginBottom: '0.35rem',
};

const INPUT = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: '#ffffff',
  border: '1.5px solid #e0e0e0',
  borderRadius: 'var(--border-radius)',
  color: '#333333',
  fontSize: '14px',
  fontFamily: 'var(--font)',
  outline: 'none',
  boxSizing: 'border-box',
};

const BTN_PRIMARY = {
  padding: '0.65rem 1.25rem',
  background: 'var(--color-teal)',
  border: 'none',
  borderRadius: 'var(--border-radius)',
  color: '#0a1628',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'var(--font)',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const BTN_GHOST = {
  padding: '0.65rem 1.25rem',
  background: 'transparent',
  border: '1.5px solid #cbd5e1',
  borderRadius: 'var(--border-radius)',
  color: '#64748b',
  fontSize: '14px',
  fontFamily: 'var(--font)',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

function extraerSystemPrompt(texto) {
  const match = texto.match(/<system_prompt>([\s\S]*?)<\/system_prompt>/);
  return match ? match[1].trim() : null;
}

export default function CrearFuncionalidad() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  const [mensajes, setMensajes] = useState([
    { role: 'assistant', content: '¡Hola! Soy el configurador de KarIA. Contame qué querés que haga esta funcionalidad y te ayudo a crear el system prompt ideal. ¿Empezamos?' },
  ]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajes]);

  async function handleEnviar(e) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || enviando) return;

    const nuevosMensajes = [...mensajes, { role: 'user', content: texto }];
    setMensajes(nuevosMensajes);
    setInput('');
    setEnviando(true);

    const nuevoHistorial = [...historial, { role: 'user', content: texto }];

    try {
      const { respuesta } = await chatConfiguradorApi.enviar(texto, historial, token);
      setMensajes([...nuevosMensajes, { role: 'assistant', content: respuesta }]);
      setHistorial([...nuevoHistorial, { role: 'assistant', content: respuesta }]);
    } catch (_) {
      setMensajes([...nuevosMensajes, { role: 'assistant', content: 'Error al conectar con el configurador. Intentá de nuevo.' }]);
    } finally {
      setEnviando(false);
    }
  }

  function handleUsarSystemPrompt(texto) {
    const extraido = extraerSystemPrompt(texto);
    if (extraido) setSystemPrompt(extraido);
  }

  async function handleGuardar() {
    if (!nombre.trim() || !systemPrompt.trim()) {
      setErrorGuardar('El nombre y el system prompt son obligatorios.');
      return;
    }
    setErrorGuardar('');
    setGuardando(true);
    try {
      await funcionalidadesApi.crear({ nombre: nombre.trim(), descripcion: descripcion.trim(), system_prompt: systemPrompt.trim() }, token);
      navigate('/chat');
    } catch (err) {
      setErrorGuardar(err.message || 'Error al guardar la funcionalidad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f6f9', fontFamily: 'var(--font)' }}>

      {/* Columna izquierda — formulario */}
      <div style={COL_IZQUIERDA}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#081c54', fontWeight: 700 }}>
            Configurá tu funcionalidad
          </h2>
          <p style={{ margin: '0.4rem 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Completá el nombre y la descripción. El configurador IA de la derecha te va a hacer preguntas y al final vas a poder copiar el system prompt generado automáticamente.
          </p>
        </div>

        <div>
          <div style={LABEL}>Nombre</div>
          <input
            style={INPUT}
            placeholder="Ej: Analista de contratos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <div style={LABEL}>Descripción</div>
          <textarea
            style={{ ...INPUT, resize: 'vertical', minHeight: '70px' }}
            placeholder="Breve descripción de qué hace esta funcionalidad"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={LABEL}>System Prompt</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.4rem' }}>
            💡 Usá el chat de la derecha para generarlo automáticamente
          </div>
          <textarea
            style={{ ...INPUT, resize: 'none', flex: 1, minHeight: '180px' }}
            placeholder="El system prompt define cómo se va a comportar el agente. Usá el chat para generarlo automáticamente."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {errorGuardar && (
          <div style={{ fontSize: '12px', color: 'var(--color-error)', padding: '0.4rem 0' }}>
            {errorGuardar}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            style={{ ...BTN_PRIMARY, opacity: guardando ? 0.6 : 1 }}
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar funcionalidad'}
          </button>
          <button
            style={BTN_GHOST}
            onClick={() => navigate('/chat')}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Columna derecha — chat configurador */}
      <div style={COL_DERECHA}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#081c54' }}>
            Configurador IA
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.5 }}>
            Contame qué querés que haga tu funcionalidad y te guío paso a paso para crear el system prompt ideal.
          </div>
        </div>

        {/* Lista de mensajes */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f9f9f9' }}>
          {mensajes.map((m, i) => {
            const esBot = m.role === 'assistant';
            const promptExtraido = esBot ? extraerSystemPrompt(m.content) : null;
            const textoVisible = m.content.replace(/<system_prompt>[\s\S]*?<\/system_prompt>/, '').trim();

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: esBot ? 'flex-start' : 'flex-end', gap: '0.4rem' }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  background: esBot ? '#e8edf5' : 'var(--color-teal)',
                  color: esBot ? '#1e293b' : '#0a1628',
                  whiteSpace: 'pre-wrap',
                }}>
                  {textoVisible || m.content}
                </div>

                {promptExtraido && (
                  <button
                    onClick={() => handleUsarSystemPrompt(m.content)}
                    style={{ ...BTN_PRIMARY, fontSize: '12px', padding: '0.4rem 0.85rem' }}
                  >
                    ✦ Usar este system prompt
                  </button>
                )}
              </div>
            );
          })}

          {enviando && (
            <div style={{ alignSelf: 'flex-start', padding: '0.65rem 0.9rem', background: '#e8edf5', borderRadius: '12px', fontSize: '13px', color: '#64748b' }}>
              Escribiendo…
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleEnviar}
          style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.6rem', background: '#ffffff' }}
        >
          <input
            style={{ ...INPUT, flex: 1 }}
            placeholder="Describí qué debe hacer esta funcionalidad…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={enviando || !input.trim()}
            style={{ ...BTN_PRIMARY, opacity: (enviando || !input.trim()) ? 0.5 : 1, padding: '0.6rem 1rem' }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
