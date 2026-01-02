/**
 * AuthContext.jsx
 *
 * This file defines the authentication context for the application.
 * AuthContext provides a centralized way to manage and share authentication state
 * (such as user login information) across the React component tree.
 * It handles persisting the auth state in localStorage to maintain user sessions
 * even after page reloads, enabling a seamless user experience.
 */

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

/**
 * AuthProvider component wraps the application (or part of it) to provide authentication state.
 * It initializes auth state from localStorage on mount and persists changes to localStorage.
 * 
 * @param {object} props - React props object
 * @param {React.ReactNode} props.children - Child components that will have access to auth context
 * @returns {JSX.Element} AuthContext provider wrapping children
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);

  // On component mount, attempt to load auth state from localStorage to persist login sessions.
  useEffect(() => {
    try {
      // localStorage is used to persist authentication info across browser sessions.
      const raw = localStorage.getItem("auth");
      if (raw) {
        setAuth(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Erreur chargement auth", e);
    }
  }, []);

  // Whenever auth state changes, update localStorage to keep it in sync.
  useEffect(() => {
    try {
      if (auth) {
        // Save current auth state as a JSON string in localStorage.
        localStorage.setItem("auth", JSON.stringify(auth));
      } else {
        // Remove auth data from localStorage when user logs out.
        localStorage.removeItem("auth");
      }
    } catch (e) {
      console.error("Erreur sauvegarde auth", e);
    }
  }, [auth]);

  /**
   * Logs out the current user by clearing the auth state.
   * This also triggers removal of auth data from localStorage.
   */
  const logout = () => {
    console.log("[AuthContext] logout");
    setAuth(null);
  };

  const value = { auth, setAuth, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context.
 * Components can use this hook to get or update auth state and trigger logout.
 * 
 * @returns {object} Auth context value containing auth, setAuth, and logout
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}