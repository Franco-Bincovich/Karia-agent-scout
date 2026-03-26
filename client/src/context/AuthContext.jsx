// context/AuthContext.jsx
// Token persistido en localStorage (key: karia_token) para sobrevivir recargas.
// login() solo persiste y setea estado — la navegación la maneja Login.jsx.

import { createContext, useState, useCallback } from 'react';

const TOKEN_KEY = 'karia_token';
const USER_KEY  = 'karia_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });

  /**
   * Guarda el token en localStorage y actualiza el estado.
   * La navegación a /chat la hace Login.jsx después de llamar a login().
   * @param {string} tokenRecibido
   * @param {Object} datosUsuario
   */
  const login = useCallback((tokenRecibido, datosUsuario) => {
    localStorage.setItem(TOKEN_KEY, tokenRecibido);
    localStorage.setItem(USER_KEY, JSON.stringify(datosUsuario));
    setToken(tokenRecibido);
    setUser(datosUsuario);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
