/**
 * @file PublicOnly.jsx
 * @description
 * Garde de routes publiques (Public Route Guard).
 *
 * Rôle
 * - Restreint l’accès aux pages publiques (authentification, inscription)
 *   aux utilisateurs NON authentifiés.
 * - Empêche un utilisateur déjà connecté d’accéder à la page de login/register.
 * - Redirige automatiquement l’utilisateur authentifié vers la page d’accueil
 *   de l’application.
 *
 * Cas d’usage typiques
 * - Page d’authentification
 * - Page d’inscription
 * - Landing page publique avant connexion
 *
 * Complémentarité
 * - Fonctionne en paire avec `RequireAuth` :
 *   - PublicOnly → protège les pages publiques
 *   - RequireAuth → protège les pages privées
 *
 * Exemple d’utilisation
 * ```jsx
 * <Route
 *   path="/"
 *   element={
 *     <PublicOnly>
 *       <Auth />
 *     </PublicOnly>
 *   }
 * />
 * ```
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function PublicOnly({ children }) {
  // Récupération de l’état d’authentification global depuis AuthContext
  // Si `auth.token` est défini, l’utilisateur est considéré comme connecté
  const { auth } = useAuth();

  /**
   * Vérification d’accès aux pages publiques
   *
   * - Si un token est présent dans l’état d’authentification,
   *   l’utilisateur ne doit plus accéder aux pages publiques.
   * - Redirection automatique vers la route principale ("/home").
   */
  if (auth?.token) {
    return <Navigate to="/home" replace />;
  }

  // Utilisateur non authentifié : rendu autorisé du contenu public
  return children;
}