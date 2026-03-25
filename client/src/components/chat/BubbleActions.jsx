// components/chat/BubbleActions.jsx
// Acciones detectadas en mensajes del agente: links de descarga, Gamma, Drive.

import FileDownloadButton from '../ui/FileDownloadButton';

const RE_XLSX = /https?:\/\/\S+\.xlsx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.xlsx\b/gi;
const RE_DOCX = /https?:\/\/\S+\.docx\b|\S*(?:\/|\\)tmp(?:\/|\\)\S+\.docx\b/gi;
const RE_GAMMA = /https?:\/\/\S*gamma\.app\S*/gi;
const RE_DRIVE = /https?:\/\/drive\.google\.com\S*/gi;

function nombreDeRuta(ruta) {
  return ruta.split(/[/\\]/).pop().split('?')[0];
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

/**
 * @param {{ texto: string }} props
 */
export default function BubbleActions({ texto }) {
  const xlsx = [...texto.matchAll(RE_XLSX)].map((m) => m[0]);
  const docx = [...texto.matchAll(RE_DOCX)].map((m) => m[0]);
  const gamma = [...texto.matchAll(RE_GAMMA)].map((m) => m[0]);
  const drive = [...texto.matchAll(RE_DRIVE)].map((m) => m[0]);

  if (!xlsx.length && !docx.length && !gamma.length && !drive.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
      {xlsx.map((r, i) => (
        <FileDownloadButton key={`xlsx-${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Excel" />
      ))}
      {docx.map((r, i) => (
        <FileDownloadButton key={`docx-${i}`} url={urlDescarga(nombreDeRuta(r))} nombre="Descargar Word" />
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
