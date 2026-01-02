/**
 * @file RequireAuth.jsx
 * @description
 * Composant de garde (Route Guard) pour les routes protégées.
 *
 * Rôle
 * - Empêche l’accès aux pages nécessitant une authentification.
 * - Vérifie la présence d’un état d’authentification valide via AuthContext.
 * - Redirige automatiquement l’utilisateur non authentifié vers la page
 *   publique d’authentification (route "/").
 *
 * Principe
 * - Ce composant s’utilise comme un wrapper autour d’une route ou d’un composant.
 * - Il s’appuie sur React Router (Navigate, useLocation).
 *
 * Exemple d’utilisation
 * ```jsx
 * <Route
 *   path="/produits"
 *   element={
 *     <RequireAuth>
 *       <Shop />
 *     </RequireAuth>
 *   }
 * />
 * ```
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RequireAuth({ children }) {
  // Récupération de l’état d’authentification global depuis AuthContext
  // `auth` doit contenir au minimum un token lorsque l’utilisateur est connecté
  const { auth } = useAuth();
  // Localisation courante : permet de mémoriser la route demandée
  // afin de pouvoir y rediriger l’utilisateur après authentification
  const location = useLocation();

  /**
   * Vérification d’accès
   *
   * - Si aucun token n’est présent dans le contexte d’authentification,
   *   l’utilisateur est considéré comme non connecté.
   * - Redirection immédiate vers la page d’authentification ("/").
   * - L’état `from` conserve la route initialement demandée.
   */
  if (!auth?.token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Utilisateur authentifié : rendu normal du contenu protégé
  return children;
}