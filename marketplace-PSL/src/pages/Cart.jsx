// src/pages/Cart.jsx (MUI version with quantity controls)
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Divider,
  Button,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { useAuth } from "../context/AuthContext.jsx";
import { createOrder } from "../services/orders";

function formatEUR(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function computeTotals(items = []) {
  const lines = items.map((it) => ({
    ...it,
    qty: Number(it.qty || 1),
    price: Number(it.price || 0),
  }));
  const subtotal = lines.reduce((acc, it) => acc + it.price * it.qty, 0);
  const tvaRate = 0.2;
  const tva = subtotal * tvaRate;
  const shipping = subtotal > 100 ? 0 : 6.9;
  const total = subtotal + tva + shipping;
  return { lines, subtotal, tva, shipping, total };
}

const keyOf = (it) => it?.id ?? it?.name;

export function Cart({
  cartCount = 0,
  items = [],
  onCheckout,
  onChangeQty,
  onRemoveItem,
  onClear,
}) {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [saving, setSaving] = useState(false);

  // Controlled vs local mode
  const isControlled =
    typeof onChangeQty === "function" || typeof onRemoveItem === "function";
  const [localItems, setLocalItems] = useState(items);
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const working = isControlled ? items : localItems;
  const { lines, subtotal, tva, shipping, total } = computeTotals(working);
  const totalCount = lines.reduce((acc, it) => acc + Number(it.qty || 1), 0);

  const handlePlaceOrder = async () => {
    if (!auth?.user?.id) {
      // pas authentifié → rediriger vers auth
      navigate("/auth", { replace: true });
      return;
    }
    setSaving(true);
    try {
      const payload = { userId: auth.user.id, lines, total };
      const res = await createOrder(payload);
      // (optionnel) onCheckout callback si tu en as un:
      onCheckout?.(lines, res);

      // vider le panier central (si fourni)
      onClear?.();

      // feedback + navigation
      alert(
        `Commande #${res.order_id} créée ✓ Total: ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(res.total)}`
      );
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      alert(`Échec commande: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Votre panier
      </Typography>

      {lines.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Panier vide
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Vous n'avez pas encore ajouté de produits.
          </Typography>
          <Button component={RouterLink} to="/produits" variant="contained">
            Parcourir les produits
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Lignes du panier */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="right">Prix</TableCell>
                    <TableCell align="right">Quantité</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((it) => (
                    <TableRow key={keyOf(it)} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {it.image_url ? (
                            <Avatar
                              variant="rounded"
                              src={it.image_url}
                              alt={it.name}
                              sx={{ width: 56, height: 56 }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{ width: 56, height: 56 }}
                            />
                          )}
                          <Box>
                            <Typography fontWeight={600}>{it.name}</Typography>
                            {it.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                {it.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">{formatEUR(it.price)}</TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Diminuer">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => onChangeQty?.(keyOf(it), -1)}
                                disabled={Number(it.qty || 1) <= 1}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Typography sx={{ width: 28, textAlign: "center" }}>
                            {Number(it.qty || 1)}
                          </Typography>
                          <Tooltip title="Augmenter">
                            <IconButton
                              size="small"
                              onClick={() => onChangeQty?.(keyOf(it), 1)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      <TableCell align="right">
                        {formatEUR(Number(it.price) * Number(it.qty || 1))}
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Retirer l'article">
                          <IconButton
                            size="small"
                            onClick={() => onRemoveItem?.(keyOf(it))}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Récapitulatif */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                position: { md: "sticky" },
                top: { md: 80 },
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Récapitulatif
              </Typography>
              <Stack spacing={1.5} divider={<Divider />} sx={{ mb: 2 }}>
                <Row
                  label={`Sous-total (${totalCount} article${totalCount > 1 ? "s" : ""})`}
                  value={formatEUR(subtotal)}
                />
                <Row label="TVA (20%)" value={formatEUR(tva)} />
                <Row
                  label="Livraison"
                  value={shipping === 0 ? "Offerte" : formatEUR(shipping)}
                />
              </Stack>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={800}>{formatEUR(total)}</Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={saving}
                onClick={handlePlaceOrder}
              >
                {saving ? "Traitement..." : "Commander"}
              </Button>
              <Button
                component={RouterLink}
                to="/produits"
                fullWidth
                sx={{ mt: 1.5 }}
              >
                Continuer mes achats
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

function Row({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography>{value}</Typography>
    </Box>
  );
}
