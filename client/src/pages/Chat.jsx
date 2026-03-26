// pages/Chat.jsx
// Pantalla principal de chat de KarIA Escobar.
// Layout: sidebar colapsable + área de mensajes + input fijo abajo.

import { useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import Layout from '../components/layout/Layout';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

const ACCEPT_EXT = ['.pdf', '.xlsx', '.xls', '.docx', '.csv', '.txt'];

function archivoValido(archivo) {
  const nombre = archivo.name.toLowerCase();
  return ACCEPT_EXT.some((ext) => nombre.endsWith(ext));
}

export default function Chat() {
  const { mensajes, enviar, cargando, cargarConversacion, nuevaConversacion, subirDocumento } = useChat();
  const [dragActivo, setDragActivo] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActivo(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Solo cuando sale del contenedor raíz
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActivo(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActivo(false);
    const archivo = e.dataTransfer.files?.[0];
    if (!archivo) return;
    if (!archivoValido(archivo)) {
      return; // silently ignore invalid types
    }
    subirDocumento(archivo);
  }, [subirDocumento]);

  return (
    <Layout onSeleccionarConversacion={cargarConversacion}>
      <div
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Overlay drag & drop */}
        {dragActivo && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(67,209,201,0.12)',
            border: '2px dashed var(--color-teal)',
            borderRadius: '8px',
            pointerEvents: 'none',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              color: 'var(--color-teal)', fontFamily: 'var(--font)', fontWeight: 600,
            }}>
              <span style={{ fontSize: '2.5rem' }}>📂</span>
              <span style={{ fontSize: '16px' }}>Soltá el archivo acá</span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>PDF · Excel · Word · CSV · TXT</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0.6rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <button
            onClick={nuevaConversacion}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.9rem',
              background: 'transparent',
              border: '1px solid rgba(67,209,201,0.4)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--color-teal)',
              fontSize: '13px', fontFamily: 'var(--font)',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>＋</span>
            <span>Nueva conversación</span>
          </button>
        </div>

        <MessageList mensajes={mensajes} cargando={cargando} />
        <ChatInput onEnviar={enviar} onSubirArchivo={subirDocumento} cargando={cargando} />
      </div>
    </Layout>
  );
}
