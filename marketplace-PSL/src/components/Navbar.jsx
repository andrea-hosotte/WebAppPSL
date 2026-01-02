/**
 * @file Navbar.jsx
 * @description
 * Barre de navigation principale (MUI AppBar) de l’application.
 *
 * Responsabilités
 * - Exposer la navigation primaire (liens) selon le profil utilisateur :
 *   - Particulier : Accueil, Produits, Panier.
 *   - Professionnel : Dashboard, Mon catalogue, Mes performances.
 * - Afficher l’état du panier via un badge (`cartCount`).
 * - Exposer une action d’authentification :
 *   - si connecté : "Se déconnecter" (appel `logout()` + redirection)
 *   - si non connecté : "S'identifier" (redirection vers la page d’auth)
 *
 * Dépendances d’architecture
 * - `useAuth()` : récupère l’état `auth` (token + user) et l’action `logout` depuis le contexte.
 * - `react-router-dom` : navigation programmatique (useNavigate) + liens (Link).
 *
 * Notes
 * - Le rendu de la Navbar doit être conditionné côté App (ex: ne pas afficher si non authentifié)
 *   si vous souhaitez un portail d’accès strict.
 */

// Auth : contexte d'authentification (token, user) + action logout
import { useAuth } from "../context/AuthContext.jsx";
// Routing : liens et navigation programmatique
import { useNavigate, Link } from "react-router-dom";
// UI : Material UI (structure AppBar + actions)
import { AppBar, Toolbar, Button, IconButton, Badge } from "@mui/material";
// Icons : Material Icons (panier + identité)
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";

/**
 * Navbar (barre de navigation).
 *
 * @param {object} props
 * @param {number} props.cartCount - Nombre d'articles dans le panier (affiché dans le badge).
 * @param {boolean} props.isPro - Indique si l'utilisateur courant est un professionnel.
 *   - true  → menu Pro (Dashboard / Catalogue / Performances)
 *   - false → menu Particulier (Accueil / Produits / Panier)
 */
export function Navbar({ cartCount, isPro }) {
  // Navigation programmatique : permet de rediriger après logout / auth.
  const navigate = useNavigate();
  // Contexte auth : `auth` contient notamment `token` (présence = utilisateur connecté).
  // Défense : `useAuth()` peut être null si le Provider n'entoure pas l'arbre React.
  const { auth, logout } = useAuth() || {};

  // Handler du bouton "S'identifier" / "Se déconnecter".
  // - Si connecté : exécute `logout()` puis redirige vers la page d'auth.
  // - Si non connecté : redirige vers la page d'auth.
  // NOTE : ici la page d'auth est `/` (adapter si vous utilisez `/auth`).
  const handleAuthClick = () => {
    if (auth?.token) {
      // Déconnexion : purge l'état auth (et typiquement le localStorage via AuthContext).
      logout?.();
      // Redirection : `replace` évite d'empiler l'historique (UX plus propre après logout).
      navigate("/", { replace: true });
    } else {
      // Redirection : `replace` évite d'empiler l'historique (UX plus propre après logout).
      navigate("/", { replace: true });
    }
  };

  return (
    // AppBar fixe : barre globale en haut, thème sombre
    <AppBar
      position="fixed"
      elevation={2}
      sx={(theme) => ({
        backgroundColor: theme.palette.mode === "dark" ? "#020617" : "#0f172a",
        color: "#f9fafb",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Toolbar
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          px: { xs: 1.5, sm: 3 },
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        {/* Branding : bouton logo/titre (clique → home) */}
        <Button
          color="inherit"
          onClick={() => navigate("/home")}
          sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
        >
          Marketplace-PSL
        </Button>

        {/* Navigation centrale : diffère selon le rôle (isPro) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Menu Professionnel */}
          {isPro ? (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/home"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/catalogue"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                Mon catalogue
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/performances"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                Mes performances
              </Button>
            </>
          ) : (
            <>
              {/* Menu Particulier */}
              <Button
                color="inherit"
                component={Link}
                to="/home"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                Accueil
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/produits"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                Produits
              </Button>
              {/* Panier : icône + badge cartCount */}
              <IconButton
                color="inherit"
                component={Link}
                to="/panier"
                sx={{
  textTransform: "none",
  fontSize: 14,
  px: 2,
  py: 0.8,
  borderRadius: 2,
  fontWeight: 600,
  color: "#f1f5f9",                // Blanc cassé lisible
  backgroundColor: "rgba(255,255,255,0.04)", // Fond gris foncé subtil
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.12)", // Bien plus visible
  },
}}
              >
                <Badge
                  badgeContent={cartCount}
                  color="primary"
                  overlap="circular"
                  max={99}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </>
          )}
        </div>

        {/* Action Auth : libellé dynamique + icône, dépend de `auth.token` */}
        <Button
          onClick={handleAuthClick}
          startIcon={<PersonIcon />}
          variant="outlined"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 2.2,
            borderColor: "rgba(148,163,184,0.7)",
            color: "#e5e7eb",
            "&:hover": {
              borderColor: "#38bdf8",
              backgroundColor: "rgba(15,23,42,0.8)",
            },
          }}
        >
          {auth?.token ? "Se déconnecter" : "S'identifier"}
        </Button>
      </Toolbar>
    </AppBar>
  );
}