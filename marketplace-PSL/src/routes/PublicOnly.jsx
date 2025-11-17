import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function PublicOnly({ children }) {
  const { auth } = useAuth();

  if (auth?.token) {
    return <Navigate to="/home" replace />;
  }

  return children;
}