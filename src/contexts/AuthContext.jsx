import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  apiFetch,
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  refreshSession,
  setSessionExpiredHandler,
} from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState('loading');

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUsuario(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    async function restoreSession() {
      if (!getRefreshToken()) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const refreshed = await refreshSession();
        if (!refreshed) {
          clearSession();
          return;
        }
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
          clearSession();
          return;
        }
        const data = await res.json();
        setUsuario(data);
        setStatus('authenticated');
      } catch {
        clearSession();
      }
    }
    restoreSession();
    // Solo al montar: la restauración de sesión ocurre una vez por carga de página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(identificador, contrasena) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, contrasena }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'login_fallido');
    }
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUsuario({ ...data.usuario, mustChangePassword: data.mustChangePassword });
    setStatus('authenticated');
    return data;
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Falla de red durante logout: igual limpiamos la sesión localmente,
      // "cerrar sesión" debe funcionar como acción local sin depender de conectividad.
    } finally {
      clearSession();
    }
  }

  async function refreshUsuario() {
    const res = await apiFetch('/auth/me');
    if (res.ok) {
      setUsuario(await res.json());
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, status, login, logout, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
