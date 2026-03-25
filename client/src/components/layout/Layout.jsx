// components/layout/Layout.jsx
// Wrapper principal: Sidebar fija a la izquierda + área de contenido a la derecha.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';

/**
 * @param {{ children: React.ReactNode, onSeleccionarConversacion: (id: string) => void }} props
 */
export default function Layout({ children, onSeleccionarConversacion }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onSeleccionarConversacion={onSeleccionarConversacion} onLogout={handleLogout} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden', background: 'var(--color-bg)',
      }}>
        {children}
      </main>
    </div>
  );
}
