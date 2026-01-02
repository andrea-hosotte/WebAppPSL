// src/pages/PayWall.jsx
/**
 * @file PayWall.jsx
 * @description
 * Page "PayWall" (étape paiement) — affichage du récapitulatif panier + formulaire de paiement.
 *
 * Rôle
 * - Reçoit le panier via `location.state` (navigation depuis /panier).
 * - Affiche un récapitulatif (items + total).
 * - Délègue la saisie/validation au composant `<PaymentForm />`.
 * - Sur succès : notifie l’utilisateur, appelle `onOrderCompleted()` (vider panier côté App), puis redirige.
 *
 * Contrat de navigation
 * - Cette page attend `location.state` sous la forme :
 *   - items: Array<{ id: number|string, name: string, qty: number, price: number }>
 *   - total: number
 * - Si ces données sont absentes, on redirige vers `/panier`.
 *
 * Sécurité / Auth
 * - `useAuth()` fournit l’utilisateur courant (userId) envoyé au back via `<PaymentForm />`.
 * - L’accès à cette route est généralement protégé par `RequireAuth` côté router.
 */

// React : effets
import { useEffect } from "react";
// Router : lecture de l'état de navigation + redirections
import { useLocation, useNavigate } from "react-router-dom";
// MUI : layout + composants UI
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
// Icônes
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CreditCardIcon from "@mui/icons-material/CreditCard";
// Auth : contexte utilisateur (id requis pour créer une commande)
import { useAuth } from "../context/AuthContext.jsx";
// Paiement : formulaire qui appelle l’API et déclenche `onPaid()` en cas de succès
import { PaymentForm } from "../components/PaymentForm.jsx";

/**
 * Page de paiement.
 *
 * @param {{ onOrderCompleted?: () => void }} props
 * - onOrderCompleted: callback fourni par App pour vider le panier après paiement.
 */
export function PayWall({ onOrderCompleted }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Contexte Auth : peut être null si le Provider n'entoure pas l'arbre (défense).
  const { auth } = useAuth() || {};
  const userId = auth?.user?.id ?? null;

  // Données panier transmises via navigation state (depuis /panier)
  const cartItems = location.state?.items ?? [];
  const total = location.state?.total ?? 0;

  // Garde-fou : si l'utilisateur arrive ici sans state (refresh / accès direct), on renvoie vers /panier.
  useEffect(() => {
    if (!cartItems.length || !total) {
      navigate("/panier", { replace: true });
    }
  }, [cartItems.length, total, navigate]);

  const handlePaymentSuccess = async () => {
    // 1) Side-effect App : vider le panier (source de vérité côté front)
    if (typeof onOrderCompleted === "function") {
      onOrderCompleted();
    }

    // 2) Feedback utilisateur (remplaçable par Snackbar MUI pour une UX plus moderne)
    window.alert("Votre commande a bien été envoyée ✅");

    // 3) Redirection post-paiement
    navigate("/home", { replace: true });
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "calc(100vh - 56px)",
        py: 6,
        background: `linear-gradient(
          135deg,
          ${theme.palette.grey[100]},
          ${theme.palette.grey[200]}
        )`,
      })}
    >
      <Container maxWidth="md">
        {/* En-tête : étape + titre + explication */}
        <Stack spacing={1.5} sx={{ mb: 4 }}>
          <Chip
            icon={<CreditCardIcon />}
            label="Étape 2 / 2 · Paiement"
            color="primary"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
          <Typography variant="h4" fontWeight={600}>
            Finaliser votre commande
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vérifiez le récapitulatif puis saisissez vos informations de paiement
            pour valider votre commande.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Colonne gauche : récapitulatif du panier */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{
                p: 2.5,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShoppingBagIcon color="primary" />
                <Typography variant="h6">Récapitulatif</Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {cartItems.length} article(s) dans votre panier.
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ flexGrow: 1, maxHeight: 260, overflowY: "auto" }}>
                <List dense disablePadding>
                  {/* Lignes panier : id (clé), libellé, quantité et prix unitaire */}
                  {cartItems.map((line) => (
                    <ListItem key={line.id} sx={{ py: 0.75 }}>
                      <ListItemText
                        primary={line.name}
                        secondary={`Qté: ${line.qty} · ${line.price.toFixed(
                          2
                        )} €`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Typography variant="subtitle1">Total TTC</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {Number(total || 0).toFixed(2)} €
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Colonne droite : formulaire de paiement (PaymentForm) */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(255,255,255,0.95)",
              }}
            >
              <PaymentForm
                total={total}
                items={cartItems}
                userId={userId}
                onPaid={handlePaymentSuccess}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}