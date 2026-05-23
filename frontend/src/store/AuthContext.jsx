import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = localStorage.getItem('cyberkeep_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (mounted) {
          setUser(response.data);
        }
      } catch {
        localStorage.removeItem('cyberkeep_token');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('cyberkeep_token', response.data.access_token);
    setUser(response.data.user);
  }

  function logout() {
    localStorage.removeItem('cyberkeep_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

