/**
 * @file Cart.jsx
 * @description
 * Page Panier (Cart) — version MUI avec contrôles de quantité.
 *
 * Rôle
 * - Affiche les lignes du panier (nom, image, description, prix, quantité).
 * - Calcule les totaux (sous-total, TVA, livraison, total).
 * - Permet de modifier les quantités et supprimer des lignes.
 * - Déclenche le passage en paiement via navigation vers `/paywall`.
 *
 * Architecture & contrat
 * - Ce composant supporte 2 modes :
 *   1) "Controlled" : le parent fournit `items` + handlers `onChangeQty`, `onRemoveItem`.
 *   2) "Local" : `items` est initialisé puis manipulé en interne (fallback).
 *   Dans l’état actuel, les actions UI appellent les handlers s’ils existent (mode controlled).
 *
 * Navigation
 * - Si l’utilisateur n’est pas authentifié (`auth.user.id` absent), redirige vers `/auth`.
 * - Sinon, navigue vers `/paywall` en transmettant `state: { items: lines, total }`.
 *
 * Notes de calcul
 * - `computeTotals()` normalise `qty` et `price` en nombres.
 * - TVA fixée à 20% (tvaRate = 0.2).
 * - Livraison : offerte au-delà de 100€, sinon 6.90€.
 */
// src/pages/Cart.jsx (MUI version with quantity controls)

// React : hooks
import { useEffect, useState } from "react";
// Router : navigation programmative + liens
import { Link as RouterLink, useNavigate } from "react-router-dom";
// UI : Material UI (layout, table, actions)
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
// Icônes MUI
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// Auth : contexte utilisateur (id requis pour checkout)
import { useAuth } from "../context/AuthContext.jsx";
// Orders : service API (importé ici mais non utilisé — le paiement est géré via /paywall)
import { createOrder } from "../services/orders";

/**
 * Formate un montant en euros (locale fr-FR).
 * @param {unknown} v
 * @returns {string}
 */
function formatEUR(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

/**
 * Calcule les lignes normalisées et les montants du panier.
 *
 * @param {Array<any>} items
 * @returns {{ lines: Array<any>, subtotal: number, tva: number, shipping: number, total: number }}
 */
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

// Clé stable côté React : priorité à l'id produit, sinon fallback sur le nom.
// Idéalement, utiliser uniquement un identifiant unique (id) fourni par l’API.
const keyOf = (it) => it?.id ?? it?.name;

/**
 * Composant Panier.
 *
 * @param {object} props
 * @param {number} [props.cartCount] - (optionnel) compteur panier (souvent affiché dans la navbar).
 * @param {Array<any>} [props.items] - lignes panier (id/name/price/qty/image_url/description...).
 * @param {Function} [props.onCheckout] - (optionnel) callback parent lors du checkout.
 * @param {(key: any, delta: number) => void} [props.onChangeQty] - handler de modification de quantité.
 * @param {(key: any) => void} [props.onRemoveItem] - handler suppression de ligne.
 * @param {() => void} [props.onClear] - (optionnel) vider le panier.
 */
export function Cart({
  cartCount = 0,
  items = [],
  onCheckout,
  onChangeQty,
  onRemoveItem,
  onClear,
}) {
  // Router : redirection vers /auth ou /paywall
  const navigate = useNavigate();
  // Auth : l’id utilisateur est requis pour passer commande
  const { auth } = useAuth();
  // UI state : verrouillage du bouton "Commander" pendant une transition (paiement / création commande)
  const [saving, setSaving] = useState(false);

  // Détection mode controlled : si des handlers existent, l’état est piloté par le parent.
  const isControlled =
    typeof onChangeQty === "function" || typeof onRemoveItem === "function";
  // Cache local pour le mode fallback (non contrôlé)
  const [localItems, setLocalItems] = useState(items);
  // Synchronisation : en mode local, aligne le cache interne sur les props.
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Source de vérité courante : items contrôlés (parent) ou items locaux (fallback).
  const working = isControlled ? items : localItems;
  // Totaux : lignes normalisées + sous-total/TVA/livraison/total
  const { lines, subtotal, tva, shipping, total } = computeTotals(working);
  const totalCount = lines.reduce((acc, it) => acc + Number(it.qty || 1), 0);

  // Checkout : garde-fou auth + navigation vers PayWall avec le panier dans `location.state`.
  const handlePlaceOrder = () => {
    // Si non authentifié : retour au portail d’authentification
    if (!auth?.user?.id) {
      navigate("/auth", { replace: true });
      return;
    }

    // Passage au paiement : on transmet les lignes et le total (source de vérité UI)
    navigate("/paywall", {
      state: {
        items: lines,
        total,
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Votre panier
      </Typography>

      {/* Empty state : panier vide → CTA vers /produits */}
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
        <>
          {/* Layout 2 colonnes : lignes (8/12) + récapitulatif sticky (4/12) */}
          <Grid container spacing={3}>
            {/* Lignes du panier */}
            <Grid item xs={12} md={8}>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  {/* Tableau : produit / prix / quantité / total ligne / actions */}
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
                    {/* Lignes du panier : rendu + contrôles de quantité + suppression */}
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
                            {/* Décrément : désactivé si qty <= 1 (évite qty 0) */}
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
                            {/* Incrément : délègue au handler parent (mode controlled) */}
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
                          {/* Suppression : délègue au handler parent */}
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
                {/* Détail des montants : sous-total, TVA, livraison */}
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
                {/* Action principale : navigation vers PayWall */}
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
        </>
      )}
    </Container>
  );
}

/**
 * Ligne récapitulatif (libellé / valeur) utilisée dans le bloc "Récapitulatif".
 * @param {{ label: string, value: any }} props
 */
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
