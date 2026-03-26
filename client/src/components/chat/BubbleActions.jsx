// components/chat/BubbleActions.jsx
// Acciones detectadas en mensajes del agente: links de descarga, Gamma, Drive.

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { filesApi } from '../../services/api';

// Detecta: URLs, rutas /tmp/, o nombres de archivo simples (ej: reporte.xlsx)
const RE_XLSX = /(?:https?:\/\/\S+\.xlsx|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.xlsx|[\w\-.()\s]*[\w\-()]\s*\.xlsx)\b/gi;
const RE_DOCX = /(?:https?:\/\/\S+\.docx|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.docx|[\w\-.()\s]*[\w\-()]\s*\.docx)\b/gi;
const RE_GAMMA = /https?:\/\/\S*gamma\.app\S*/gi;
const RE_DRIVE = /https?:\/\/drive\.google\.com\S*/gi;

function nombreDeRuta(ruta) {
  return ruta.trim().split(/[/\\]/).pop().split('?')[0].trim();
}

function urlDescarga(nombre) {
  return `/api/files/download?file=${encodeURIComponent(nombre)}`;
}

const linkStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  marginTop: '0.4rem', marginRight: '0.5rem',
  color: 'var(--color-teal)', fontSize: '12px', fontWeight: 600,
  textDecoration: 'none',
};

function DescargaBtn({ nombre }) {
  const { token } = useAuth();
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setDescargando(true);
    setError(false);
    try {
      await filesApi.descargar(nombre, token);
    } catch {
      setError(true);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={descargando}
      title={error ? 'No se pudo descargar' : `Descargar ${nombre}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        marginTop: '0.5rem',
        padding: '0.4rem 0.85rem',
        background: error ? '#94a3b8' : 'var(--color-teal)',
        color: 'var(--color-primary)',
        border: 'none', borderRadius: 'var(--border-radius)',
        fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font)',
        cursor: descargando ? 'wait' : 'pointer',
        opacity: descargando ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <span>{error ? '✕' : '↓'}</span>
      {descargando ? 'Descargando…' : error ? 'Error' : nombre}
    </button>
  );
}

/**
 * @param {{ texto: string }} props
 */
export default function BubbleActions({ texto }) {
  const archivosXlsx = [...texto.matchAll(RE_XLSX)].map((m) => nombreDeRuta(m[0])).filter(Boolean);
  const archivosDocx = [...texto.matchAll(RE_DOCX)].map((m) => nombreDeRuta(m[0])).filter(Boolean);
  const gamma = [...texto.matchAll(RE_GAMMA)].map((m) => m[0]);
  const drive = [...texto.matchAll(RE_DRIVE)].map((m) => m[0]);

  if (!archivosXlsx.length && !archivosDocx.length && !gamma.length && !drive.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
      {archivosXlsx.map((nombre, i) => (
        <DescargaBtn key={`xlsx-${i}`} nombre={nombre} />
      ))}
      {archivosDocx.map((nombre, i) => (
        <DescargaBtn key={`docx-${i}`} nombre={nombre} />
      ))}
      {gamma.map((url, i) => (
        <a key={`gamma-${i}`} href={url} target="_blank" rel="noreferrer" style={linkStyle}>
          Ver presentación →
        </a>
      ))}
      {drive.map((url, i) => (
        <a key={`drive-${i}`} href={url} target="_blank" rel="noreferrer" style={linkStyle}>
          Abrir en Drive →
        </a>
      ))}
    </div>
  );
}
