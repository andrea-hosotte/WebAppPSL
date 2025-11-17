import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// MUI
import { Box, Container, Paper, Typography } from "@mui/material";

// Components
import { AuthPanel } from "../components/AuthPanel.jsx";

// Page d'authentification (login / register)

export function Auth() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (auth?.token) {
      navigate(state?.from?.pathname || "/home", { replace: true });
    }
  }, [auth, navigate, state]);

  return (
    <Box sx={{ minHeight: "calc(100vh - 56px)", display: "grid", placeItems: "center", py: 3 }}>
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, color: 'text.primary' }}>
              MarketPlace
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Veuillez vous connecter ou créer un compte pour continuer
            </Typography>
          </Box>
          <AuthPanel />
        </Paper>
      </Container>
    </Box>
  );
}