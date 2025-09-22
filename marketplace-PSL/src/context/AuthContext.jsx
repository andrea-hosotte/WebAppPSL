import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem('psl_auth')) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem('psl_auth', JSON.stringify(auth));
    else localStorage.removeItem('psl_auth');
  }, [auth]);

  const value = { auth, setAuth, logout: () => setAuth(null) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
