// src/components/Navbar.jsx
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AppBar, Toolbar, Box, Button, IconButton, Badge } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";

export function Navbar({ cartCount = 0, ...rest }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button component={RouterLink} to="/home" color="primary">
            Accueil
          </Button>
          <Button component={RouterLink} to="/produits">
            Produits
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            onClick={() => {
              if (auth?.token) {
                logout?.();
              } else {
                navigate("/", { replace: true });
              }
            }}
            startIcon={<PersonIcon />}
            variant="outlined"
            size="small"
          >
            {auth?.token ? "Se déconnecter" : "S'identifier"}
          </Button>
          <IconButton onClick={() => navigate("/panier")} aria-label="Panier">
            <Badge
              badgeContent={cartCount}
              color="secondary"
              overlap="circular"
              showZero
            >
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
