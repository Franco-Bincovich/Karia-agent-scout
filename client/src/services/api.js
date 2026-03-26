// services/api.js
// Wrapper centralizado para todas las llamadas al backend.
// Lee el token desde el contexto — nunca desde localStorage.

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Error de red');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const authApi = {
  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

export const chatApi = {
  enviar: (mensaje, conversacionId, token) => {
    const body = { mensaje };
    if (conversacionId) body.conversacionId = conversacionId;
    return apiFetch('/api/chat', { method: 'POST', body: JSON.stringify(body) }, token);
  },
};

export const conversacionesApi = {
  listar: (token) => apiFetch('/api/conversaciones', {}, token),
  cargar: (id, token) => apiFetch(`/api/conversaciones/${id}`, {}, token),
};

export const integracionesApi = {
  listar: (token) => apiFetch('/api/integraciones', {}, token),
  conectarApiKey: (tipo, apiKey, token) =>
    apiFetch('/api/integraciones/apikey', { method: 'POST', body: JSON.stringify({ tipo, apiKey }) }, token),
  desconectar: (tipo, token) =>
    apiFetch(`/api/integraciones/${tipo}`, { method: 'DELETE' }, token),
};

export const funcionalidadesApi = {
  listar: (token) => apiFetch('/api/funcionalidades', {}, token),
  crear: (datos, token) =>
    apiFetch('/api/funcionalidades', { method: 'POST', body: JSON.stringify(datos) }, token),
  toggle: (id, token) =>
    apiFetch(`/api/funcionalidades/${id}/toggle`, { method: 'PATCH' }, token),
};

export const chatConfiguradorApi = {
  enviar: (mensaje, historial, token) =>
    apiFetch('/api/chat/configurador', { method: 'POST', body: JSON.stringify({ mensaje, historial }) }, token),
};

export const filesApi = {
  /**
   * Descarga un archivo generado por el agente y lo dispara como descarga del navegador.
   * @param {string} nombreArchivo - Nombre del archivo (ej: reporte.xlsx)
   * @param {string} token - JWT del usuario
   */
  descargar: async (nombreArchivo, token) => {
    const res = await fetch(`${BASE_URL}/api/files/download?file=${encodeURIComponent(nombreArchivo)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Error al descargar: HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

export async function uploadDocumento(archivo, token) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const res = await fetch(`${BASE_URL}/api/documentos/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Error al subir el documento');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}
