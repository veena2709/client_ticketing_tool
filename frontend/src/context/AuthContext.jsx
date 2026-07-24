import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: authUser } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const signup = async (payload) => {
    await api.post('/auth/signup', payload);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, signup, logout, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
