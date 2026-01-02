import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// MUI
import { Box, Container, Paper, Typography } from "@mui/material";

// Components
import { AuthPanel } from "../components/AuthPanel.jsx";

/**
 * Auth page component responsible for rendering the authentication interface.
 * This page provides UI for users to log in or register.
 * 
 * The component handles redirection if the user is already authenticated,
 * ensuring they don't see the login/register form unnecessarily.
 * 
 * It uses Material-UI components for layout and styling.
 */
export function Auth() {
  // useAuth provides authentication state and methods from context
  const { auth } = useAuth();

  // useNavigate allows programmatic navigation to other routes
  const navigate = useNavigate();

  // useLocation provides access to the current location object,
  // including any state passed during navigation (e.g., intended redirect path)
  const { state } = useLocation();

  /**
   * useEffect hook runs on component mount and whenever auth, navigate, or state changes.
   * 
   * If the user is authenticated (auth.token exists), it redirects them to the
   * originally intended page (stored in state.from.pathname) or to "/home" by default.
   * This prevents authenticated users from seeing the auth page again.
   */
  useEffect(() => {
    if (auth?.token) {
      navigate(state?.from?.pathname || "/home", { replace: true });
    }
  }, [auth, navigate, state]);

  return (
    // Outer Box centers the content vertically and horizontally,
    // with minimum height to fill viewport minus header height,
    // and vertical padding
    <Box sx={{ minHeight: "calc(100vh - 56px)", display: "grid", placeItems: "center", py: 3 }}>
      {/* Container limits the max width of the content for better readability */}
      <Container maxWidth="sm">
        {/* Paper provides elevation and background styling for the form container */}
        <Paper elevation={6} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
          {/* Header box contains the title and subtitle, centered with margin */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, color: 'text.primary' }}>
              MarketPlace
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Veuillez vous connecter ou créer un compte pour continuer
            </Typography>
          </Box>

          {/*
            AuthPanel component encapsulates the actual login/register form logic and UI.
            This separation keeps Auth.jsx focused on layout and redirection,
            while AuthPanel handles form state, validation, and submission.
          */}
          <AuthPanel />
        </Paper>
      </Container>
    </Box>
  );
}