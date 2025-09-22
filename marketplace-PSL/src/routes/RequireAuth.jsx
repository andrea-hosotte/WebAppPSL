// src/routes/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAuth({ children }) {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth?.token) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}
