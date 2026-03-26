// components/layout/SidebarFuncionalidades.jsx
// Lista de funcionalidades activas con toggle, más botón para crear nueva.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { funcionalidadesApi } from '../../services/api';

/**
 * @param {{ token: string|null }} props
 */
export default function SidebarFuncionalidades({ token }) {
  const [funcionalidades, setFuncionalidades] = useState([]);
  const navigate = useNavigate();

  async function cargar() {
    if (!token) return;
    try {
      const data = await funcionalidadesApi.listar(token);
      setFuncionalidades(data.funcionalidades || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[SidebarFuncionalidades] Error al cargar:', err.message);
      setFuncionalidades([]);
    }
  }

  useEffect(() => { cargar(); }, [token]);

  async function handleToggle(id) {
    try {
      await funcionalidadesApi.toggle(id, token);
      // Flip activo en estado local sin recargar
      setFuncionalidades((prev) =>
        prev.map((f) => f.id === id ? { ...f, activo: !f.activo } : f)
      );
    } catch (_) {}
  }

  return (
    <>
      {/* Funcionalidad base — siempre visible, no desactivable */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem 0.3rem 1rem' }}>
        <span style={{ fontSize: '13px' }}>📄</span>
        <span style={{ fontSize: '12px', color: 'var(--color-white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Análisis de documentos
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-teal)', fontWeight: 600, flexShrink: 0 }}>Base</span>
      </div>

      {funcionalidades.map((f) => (
        <div
          key={f.id}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.75rem 0.3rem 1rem', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {f.nombre}
          </span>

          {/* Toggle pill */}
          <button
            onClick={() => handleToggle(f.id)}
            title={f.activo !== false ? 'Desactivar' : 'Activar'}
            style={{
              position: 'relative', width: '28px', height: '16px', borderRadius: '8px',
              background: f.activo !== false ? 'var(--color-teal)' : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: '2px',
              left: f.activo !== false ? '12px' : '2px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
        </div>
      ))}

      <button
        onClick={() => navigate('/crear-funcionalidad')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 1rem', cursor: 'pointer', borderRadius: 'var(--border-radius)', transition: 'background 0.2s', border: 'none', background: 'transparent', width: '100%', color: 'var(--color-teal)', fontSize: '13px', fontFamily: 'var(--font)', textAlign: 'left' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(67,209,201,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: '14px' }}>＋</span>
        <span>Agregar funcionalidad</span>
      </button>
    </>
  );
}
