import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, registerAuthFailureCallback } from '../utils/api';

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { accessToken, ...userData } = res.data;
      setAccessToken(accessToken);
      
      const decoded = parseJwt(accessToken);
      const roleFromToken = decoded?.role || userData.role;
      const finalUserData = { ...userData, role: roleFromToken };
      
      setUser(finalUserData);
      return finalUserData;
    } catch (err) {
      throw err.response?.data?.message || 'Invalid credentials';
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error on server', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const silentRefresh = async () => {
    try {
      const res = await api.post('/api/auth/refresh');
      const { accessToken, ...userData } = res.data;
      setAccessToken(accessToken);
      
      const decoded = parseJwt(accessToken);
      const roleFromToken = decoded?.role || userData.role;
      const finalUserData = { ...userData, role: roleFromToken };
      
      setUser(finalUserData);
    } catch (err) {
      console.log('No active session found (silent refresh skipped)');
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerAuthFailureCallback(() => {
      setUser(null);
    });

    silentRefresh();
  }, []);

  const updateUser = (updatedData) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
