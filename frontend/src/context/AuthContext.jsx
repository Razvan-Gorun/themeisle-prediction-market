import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(__API_URL__ + '/auth/me', {
          credentials: 'include'
        });
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error('Eroare la verificarea autentificării:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await fetch(__API_URL__ + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      const meRes = await fetch(__API_URL__ + '/auth/me', { credentials: 'include' });
      const meData = await meRes.json();
      setUser(meData.user);
    }
    return { success: res.ok, error: data.error };
  };

  const register = async (username, password) => {
    const res = await fetch(__API_URL__ + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      const meRes = await fetch(__API_URL__ + '/auth/me', { credentials: 'include' });
      const meData = await meRes.json();
      setUser(meData.user);
    }
    return { success: res.ok, error: data.error };
  };

  const logout = async () => {
    await fetch(__API_URL__ + '/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};