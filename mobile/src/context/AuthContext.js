import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { apiErrorMessage } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('fitforge_token');
        if (token) {
          const { data } = await api.get('/api/auth/me');
          setUser(data.user);
        }
      } catch (e) {
        await AsyncStorage.removeItem('fitforge_token');
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function login(username, password) {
    const { data } = await api.post('/api/auth/login', { username, password });
    await AsyncStorage.setItem('fitforge_token', data.token);
    setUser(data.user);
  }

  async function signup(username, fullName, email, password) {
    // Does not log in yet — triggers an email code the caller must verify.
    await api.post('/api/auth/signup', { username, fullName, email, password });
  }

  async function resendCode(email) {
    await api.post('/api/auth/resend', { email });
  }

  async function verify(email, code) {
    const { data } = await api.post('/api/auth/verify', { email, code });
    await AsyncStorage.setItem('fitforge_token', data.token);
    setUser(data.user);
  }

  async function logout() {
    await AsyncStorage.removeItem('fitforge_token');
    setUser(null);
  }

  function updatePoints(delta) {
    setUser((u) => (u ? { ...u, points: u.points + delta } : u));
  }

  return (
    <AuthContext.Provider value={{ user, booting, login, signup, verify, resendCode, logout, updatePoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { apiErrorMessage };
