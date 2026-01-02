/**
 * @file Dashboard.jsx
 * @description
 * Dashboard "vendeur" (compte Professionnel) — agrège et visualise les KPIs issus de l’API `performance.php`.
 *
 * Sources de données
 * - `GET /api/performance.php?user_id=...`
 *   - `products`: produits du vendeur (filtrés par `products.Id_seller = user_id` côté back)
 *   - `orders`: commandes agrégées (incluant `date` + `total`)
 *   - `by_product`: agrégats par produit (CA, quantités vendues, nb commandes)
 *   - `totals`: KPIs globaux (orders_count, items_sold, revenue)
 *
 * Principes
 * - Le back renvoie parfois des montants en centimes (entiers) ou en euros (string/float).
 *   → `normalizeMoney()` standardise en **euros** pour l’affichage et les calculs.
 * - Le graphe (Recharts) attend une série `{ date: 'YYYY-MM-DD', total: number, label: 'dd/mm' }`.
 * - Le dashboard se base sur l’utilisateur courant via `useAuth()`.
 *
 * Gestion d’erreurs
 * - Réponse non JSON : souvent une erreur PHP/Apache → message explicite.
 * - `data.ok !== true` : l’API a signalé une erreur métier/SQL.
 */
// src/pages/Dashboard.jsx

// React : hooks (fetch au montage, mémoïsation des calculs)
import { useEffect, useMemo, useState } from "react";
// Routing : liens internes vers les pages détaillées
import { Link as RouterLink } from "react-router-dom";
// UI : Material UI (layout, feedback et composants)
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
// DataViz : Recharts (courbe temporelle)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
// Auth : identité utilisateur (seller_id) issue du contexte
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Normalise un montant (centimes / euros / string) vers un nombre en euros.
 *
 * Contexte
 * - Selon les endpoints/SQL, les montants peuvent être renvoyés :
 *   - en centimes (INT) → ex: 22140
 *   - en euros (FLOAT/DECIMAL) → ex: 220.40
 *   - en string ("220.40" / "220,40")
 *
 * Règle
 * - Si la valeur est un entier (Number.isInteger) → on suppose centimes → /100.
 * - Sinon → on suppose déjà en euros.
 *
 * @param {unknown} amount
 * @returns {number} Montant en euros (float)
 */
function normalizeMoney(amount) {

  if (amount == null) return 0;

  if (typeof amount === "string") {
    const s = amount.trim();
    if (s === "") return 0;
    // déjà en euros si présence d'un séparateur décimal
    if (s.includes(".") || s.includes(",")) {
      const n = Number(s.replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    if (Number.isInteger(n)) return n / 100;
    return n;
  }

  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  if (Number.isInteger(n)) return n / 100;
  return n;
}

/**
 * Formatage d’un montant en euros (locale fr-FR).
 * @param {unknown} amount
 * @returns {string}
 */
function eur(amount) {
  const n = normalizeMoney(amount);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/**
 * Appelle l’API performance (vendeur) et renvoie le JSON validé.
 *
 * @param {string|number} userId
 * @returns {Promise<any>} payload `performance.php` (doit contenir `{ ok: true, ... }`)
 * @throws {Error} si HTTP != 2xx, si `ok=false`, ou si la réponse n’est pas du JSON.
 */
async function fetchPerformance(userId) {
  const url = `http://localhost/api/performance.php?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Réponse non JSON (probable erreur PHP). Vérifie error_log Apache/PHP.");
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Erreur API (${res.status})`);
  }

  return data;
}

/**
 * Dashboard vendeur (Professional).
 *
 * Responsabilités
 * - Charger le package performance pour l'utilisateur connecté.
 * - Calculer des indicateurs dérivés (stock, stats du mois, série temporelle, top produits).
 * - Rendre :
 *   - Cartes récap (catalogue + perfs du mois)
 *   - Courbe temporelle (CA par jour)
 *   - Top produits + actions rapides
 */
export function Dashboard() {
  // Contexte d’authentification : contient l’utilisateur courant (vendeur)
  const { auth } = useAuth();
  // Identifiant vendeur utilisé par l’API performance (filtrage server-side)
  const userId = auth?.user?.id;

  // State de chargement : pattern "loading/error/data"
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    // Flag de sécurité : évite setState après un unmount (race condition)
    let alive = true;

    (async () => {
      // Sans userId, on ne peut pas appeler l’API (route normalement protégée par RequireAuth)
      if (!userId) {
        setState({ loading: false, error: "Utilisateur non identifié.", data: null });
        return;
      }

      // Reset avant fetch
      setState({ loading: true, error: "", data: null });
      try {
        // Fetch du package performance (produits, lignes, commandes, agrégats)
        const data = await fetchPerformance(userId);
        if (!alive) return;
        setState({ loading: false, error: "", data });
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e?.message || "Erreur de chargement", data: null });
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  // Calculs dérivés (memo) : centralise toute la logique d'agrégation UI
  const computed = useMemo(() => {
    const data = state.data;
    if (!data) return null;

    // Produits du vendeur (déjà filtrés côté back) — utilisé pour stock/catalogue
    const products = Array.isArray(data.products) ? data.products : [];
    // KPIs globaux fournis par l'API (peuvent être 0 si aucune vente)
    const totals = data.totals || { orders_count: 0, items_sold: 0, revenue: 0 };

    // Stock : "en ligne" ≈ stock > 0 (règle métier simplifiée)
    const outOfStock = products.filter((p) => Number(p.stock ?? 0) <= 0).length;
    const totalProducts = products.length;
    const onlineProducts = Math.max(0, totalProducts - outOfStock);

    // Fenêtre temporelle : mois courant (local time) pour les KPIs "du mois"
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Commandes : normalisation des clés (selon naming côté SQL/PHP)
    const ordersRaw = Array.isArray(data.orders) ? data.orders : [];
    // Normalise: id/date/total (total converti en euros via normalizeMoney)
    const orders = ordersRaw
      .map((o) => ({
        id: o.Id_commande ?? o.id_commande ?? o.id ?? null,
        date: o.date || o.commande_date || o.date_commande || o.Date_commande || "",
        total: normalizeMoney(o.total ?? o.commande_total ?? 0),
      }))
      .filter((o) => o.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filtre mois courant (attention aux timezones si dates stockées sans timezone)
    const ordersMonth = orders.filter((o) => {
      const d = new Date(o.date);
      return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year;
    });

    const revenueMonth = ordersMonth.reduce((s, o) => s + Number(o.total || 0), 0);
    const ordersCountMonth = ordersMonth.length;
    const avgCartMonth = ordersCountMonth > 0 ? revenueMonth / ordersCountMonth : 0;

    // Série temporelle : agrégation par jour (somme des totaux)
    const byDay = new Map();
    for (const o of orders) {
      const d = new Date(o.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      byDay.set(key, (byDay.get(key) || 0) + Number(o.total || 0));
    }
    const series = Array.from(byDay.entries())
      .map(([date, total]) => ({
        date,
        total,
        label: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top produits : tri par chiffre d’affaires (CA) décroissant
    const byProduct = Array.isArray(data.by_product) ? data.by_product : [];
    const topProducts = byProduct
      .slice()
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 5)
      .map((p) => ({
        id_product: p.id_product,
        name: p.name || `Produit #${p.id_product}`,
        revenue: Number(p.revenue || 0),
        orders: Number(p.orders_count || p.orders || 0),
        qty: Number(p.qty_sold || 0),
      }));

    return {
      products,
      totals,
      totalProducts,
      onlineProducts,
      outOfStock,
      ordersCountMonth,
      revenueMonth,
      avgCartMonth,
      series,
      topProducts,
    };
  }, [state.data]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Tableau de bord vendeur
      </Typography>

      {state.loading && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Chargement…</Typography>
        </Paper>
      )}

      {!state.loading && state.error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {state.error}
        </Alert>
      )}

      {!state.loading && !state.error && computed && (
        <Grid container spacing={3}>
          {/* Layout principal : 2 colonnes (gauche = 8/12, droite = 4/12) */}
          {/* Colonne gauche : résumé catalogue + résumé perfs */}
          <Grid item xs={12} md={8}>
            {/* Récapitulatif en 2 cartes : catalogue + performances du mois */}
            <Grid container spacing={2}>
              {/* Résumé catalogue */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography variant="subtitle1">Résumé catalogue</Typography>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="h5">{computed.totalProducts} produits</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {computed.onlineProducts} en stock • {computed.outOfStock} en rupture
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      label="Voir le catalogue détaillé"
                      color="primary"
                      variant="outlined"
                      component={RouterLink}
                      to="/catalog"
                      clickable
                    />
                  </Stack>
                </Paper>
              </Grid>

              {/* Résumé performances */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography variant="subtitle1">Résumé des performances du mois</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aperçu du chiffre d’affaires et des commandes sur le mois en cours.
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      CA du mois
                    </Typography>
                    <Typography variant="h5">{eur(computed.revenueMonth)}</Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Commandes
                    </Typography>
                    <Typography variant="h6">{computed.ordersCountMonth} commandes</Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Panier moyen (mois)
                    </Typography>
                    <Typography variant="h6">{eur(computed.avgCartMonth)}</Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      label="Voir les performances détaillées"
                      color="primary"
                      variant="outlined"
                      component={RouterLink}
                      to="/performances"
                      clickable
                    />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* Courbe temporelle : CA agrégé par jour (Recharts) */}
            <Paper elevation={1} sx={{ mt: 3, p: 2.5, borderRadius: 2, overflow: "visible" }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Tendance globale (commandes)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Montant total des commandes (somme par jour).
              </Typography>

              {computed.series.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Aucune commande trouvée pour tes produits.
                </Alert>
              ) : (
                <Box sx={{ height: { xs: 280, md: 320 }, pl: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={computed.series} margin={{ top: 10, right: 16, left: 24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis
                        width={90}
                        tickFormatter={(v) =>
                          Number(v).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        }
                      />
                      <Tooltip
                        formatter={(value) => eur(value)}
                        labelFormatter={(label, payload) => {
                          const raw = payload?.[0]?.payload?.date;
                          if (!raw) return label;
                          const dt = new Date(raw);
                          return Number.isNaN(dt.getTime()) ? String(raw) : dt.toLocaleDateString("fr-FR");
                        }}
                      />
                      <Line type="monotone" dataKey="total" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Colonne droite : top produits + CTA */}
          <Grid item xs={12} md={4}>
            {/* Top produits : classement CA (issu de by_product) */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                mb: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="subtitle1">Top produits (global)</Typography>
              {computed.topProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Pas encore de ventes.
                </Typography>
              ) : (
                <List dense>
                  {computed.topProducts.map((p, idx) => (
                    <Box key={p.id_product}>
                      <ListItem disableGutters>
                        <ListItemText
                          primary={p.name}
                          secondary={`${p.qty} vendu(s) • ${eur(p.revenue)} de CA`}
                        />
                      </ListItem>
                      {idx < computed.topProducts.length - 1 && <Divider component="li" />}
                    </Box>
                  ))}
                </List>
              )}
            </Paper>

            {/* Actions rapides : navigation vers les pages "zoom" */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Typography variant="subtitle1">Actions rapides</Typography>
              <Typography variant="body2" color="text.secondary">
                Gère ton activité en quelques clics :
              </Typography>
              <Stack spacing={1}>
                <Button fullWidth size="small" variant="contained" component={RouterLink} to="/catalog">
                  Gérer mon catalogue
                </Button>
                <Button fullWidth size="small" variant="outlined" component={RouterLink} to="/performances">
                  Voir mes performances
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}