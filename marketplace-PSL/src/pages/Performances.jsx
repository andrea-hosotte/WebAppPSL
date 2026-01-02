/**
 * @file Performances.jsx
 * @description
 * Page "Performances" (vue vendeurs / comptes professionnels).
 *
 * Objectif fonctionnel
 * - Consommer l’API back `performance.php` afin d’afficher :
 *   - des KPIs (CA, nb commandes, articles vendus, panier moyen)
 *   - un top produits par chiffre d’affaires
 *   - un graphe temporel (montant des commandes dans le temps)
 *   - un aperçu des lignes de ventes
 *
 * Flux de données (high level)
 * 1) Récupération de l’utilisateur connecté via `useAuth()`
 * 2) Appel API `fetchPerformance(userId)`
 * 3) `useMemo` calcule des agrégats/transformations pour la UI
 * 4) Rendu MUI + Recharts
 *
 * Notes techniques
 * - Le back peut renvoyer du HTML (fatal PHP) : la page protège le parsing JSON.
 * - `alive` empêche les setState après un unmount (pattern anti-memory leak).
 * - Le format monétaire est centralisé dans `eur()`.
 */

// React : hooks d’état, effets et memoization
import { useEffect, useMemo, useState } from "react";

// MUI : layout + composants de restitution (KPIs, tables, feedback)
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";

// Auth : accès à l’utilisateur connecté (seller)
import { useAuth } from "../context/AuthContext.jsx";

// Recharts : rendu du graphique temporel (CA dans le temps)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * Formatte un montant en euros (locale fr-FR).
 *
 * @param {number|string|null|undefined} amount - Montant (tolère null/undefined/strings).
 * @returns {string} Montant formaté (ex: "1 234,00 €").
 */
function eur(amount) {
  const n = Number(amount || 0);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/**
 * Appelle l’API de performance côté back.
 *
 * @param {number|string} userId - Identifiant du vendeur (users.id).
 * @returns {Promise<any>} Payload JSON validé (data.ok === true).
 *
 * @throws {Error}
 * - Réponse non JSON (souvent une page HTML en cas de fatal PHP)
 * - Erreur HTTP ou `ok: false`
 */
async function fetchPerformance(userId) {
  // Endpoint performance : paramètre user_id utilisé pour filtrer les ventes du vendeur
  const url = `http://localhost/api/performance.php?user_id=${encodeURIComponent(userId)}`;

  // credentials: include → permet d’embarquer les cookies/session si l’API en dépend
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  // Sécurisation parsing : en cas de fatal PHP, Apache/PHP peut renvoyer une page HTML.
  // On lit la réponse en texte puis on tente un JSON.parse contrôlé.
  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Réponse non JSON (probable erreur PHP). Voir les logs Apache/PHP.");
  }

  // Contrat API : on considère l’appel en échec si HTTP non-2xx ou si { ok:false }
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Erreur API (${res.status})`);
  }

  return data;
}

/**
 * Page Performances.
 *
 * Pré-requis : l’utilisateur doit être authentifié.
 * Cette page dépend de `auth.user.id` pour appeler l’API.
 */
export function Performances() {
  // Contexte d’authentification : contient le profil utilisateur (seller)
  const { auth } = useAuth();

  // Identifiant vendeur utilisé pour filtrer les données de performance côté back
  const userId = auth?.user?.id;

  // state : cycle de vie de la requête (loading/error/data)
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    // Chargement des performances à chaque changement de userId
    let alive = true;

    (async () => {
      // Aucun userId : l’utilisateur n’est pas identifié (ou contexte non initialisé)
      if (!userId) {
        setState({ loading: false, error: "Utilisateur non identifié.", data: null });
        return;
      }

      // Reset UI : on affiche le loader et on purge la donnée précédente
      setState({ loading: true, error: "", data: null });

      try {
        // Appel API : retourne un payload { ok:true, totals, by_product, orders?, lines?, ... }
        const data = await fetchPerformance(userId);
        if (!alive) return;

        // Succès : on stocke la donnée brute dans l’état (le rendu utilise `computed`)
        setState({ loading: false, error: "", data });
      } catch (e) {
        if (!alive) return;

        // Échec : message utilisateur + conservation d’un état cohérent
        setState({ loading: false, error: e?.message || "Erreur de chargement", data: null });
      }
    })();

    // Cleanup : évite setState si la page est démontée pendant la requête
    return () => {
      alive = false;
    };
  }, [userId]);

  const computed = useMemo(() => {
    // `computed` prépare un modèle de vue (ViewModel) optimisé pour la UI.
    // On isole ici toute la logique d’agrégation/tri/formatage afin de garder le render simple.
    const data = state.data;
    if (!data) return null;

    // KPIs globaux (fallback si l’API ne renvoie pas toutes les clés)
    const totals = data.totals || { orders_count: 0, items_sold: 0, revenue: 0 };
    const byProduct = Array.isArray(data.by_product) ? data.by_product : [];

    // Top produits par chiffre d’affaires (CA)
    const top = byProduct
      .slice()
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 8);

    // Ratios : panier moyen (AOV) et articles/commande
    const orders = Number(totals.orders_count || 0);
    const items = Number(totals.items_sold || 0);
    const revenue = Number(totals.revenue || 0);
    const aov = orders > 0 ? revenue / orders : 0; // panier moyen
    const unitsPerOrder = orders > 0 ? items / orders : 0;

    // Série temporelle des commandes (date -> total)
    // Source temporelle préférée : `orders` (1 ligne = 1 commande)
    const ordersRaw = Array.isArray(data.orders) ? data.orders : [];

    let series = [];

    if (ordersRaw.length > 0) {
      series = ordersRaw
        .map((o) => ({
          // La colonne SQL est `date` (table commande) mais selon le mapping PHP elle peut arriver sous différents noms
          date:
            o.date ||
            o.commande_date ||
            o.date_commande ||
            o.Date_commande ||
            o.Date ||
            o.created_at ||
            "",
          // Le total peut arriver sous `total` ou `commande_total` (selon la jointure)
          total: Number(o.total ?? o.commande_total ?? o.Total ?? o.amount ?? 0),
        }))
        .filter((p) => p.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (Array.isArray(data.lines) && data.lines.length > 0) {
      // Fallback : si le back ne renvoie pas `orders`, on tente de reconstruire une série depuis `lines`
      // Ex: line.date / line.total / line.prix
      const acc = new Map();

      for (const l of data.lines) {
        const d =
          l.commande_date ||
          l.date_commande ||
          l.date ||
          l.Date ||
          l.created_at ||
          "";

        // Si l’API fournit le total de commande au niveau des lignes, on préfère ce total (mais on évite de le sommer plusieurs fois)
        // Sinon on agrège à partir du prix/quantité si disponible.
        let amount = 0;

        // 1) Total de la commande (si présent) : on l’agrège une seule fois par commande_id
        const cmdId = l.commande_id ?? l.Id_commande ?? null;
        const cmdTotal = l.commande_total ?? null;

        if (!d) continue;
        const key = d;

        if (cmdId && cmdTotal != null) {
          // Utilise une clé plus précise pour éviter le double comptage si plusieurs lignes ont le même total
          const uniqKey = `${key}::${cmdId}`;
          if (!acc.has(uniqKey)) {
            acc.set(uniqKey, Number(cmdTotal) || 0);
          }
          continue;
        }

        // 2) Fallback: prix * quantité si ces champs existent
        const q = Number(l.quantite ?? l.qty ?? 1) || 1;
        const unit = Number(l.price ?? l.prix ?? l.total ?? l.Total ?? 0) || 0;
        amount = unit * q;

        // Agrégation simple par date
        acc.set(key, (acc.get(key) || 0) + amount);
      }

      series = Array.from(acc.entries())
        .map(([k, total]) => {
          const date = String(k).includes("::") ? String(k).split("::")[0] : k;
          return { date, total };
        })
        // si on a plusieurs points pour une même date (plusieurs commandes), on re-somme par date
        .reduce((map, p) => {
          map.set(p.date, (map.get(p.date) || 0) + Number(p.total || 0));
          return map;
        }, new Map());

      series = Array.from(series.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Axe X : on génère un label court (JJ/MM) tout en gardant la date brute pour le tooltip
    const seriesFmt = series.map((p) => ({
      ...p,
      label: (() => {
        const dt = new Date(p.date);
        if (Number.isNaN(dt.getTime())) return String(p.date);
        return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      })(),
    }));

    return { totals, top, aov, unitsPerOrder, series: seriesFmt };
  }, [state.data]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Mes performances
      </Typography>

      {state.loading && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={22} />
          <Typography color="text.secondary">Chargement des performances…</Typography>
        </Paper>
      )}

      {!state.loading && state.error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {state.error}
        </Alert>
      )}

      {!state.loading && !state.error && computed && (
        <Grid container spacing={3}>
          {/*
            Bloc gauche (md=8)
            - KPIs
            - Graphique temporel
            - Top produits
          */}
          <Grid item xs={12} md={8}>
            {/* KPIs */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Chiffre d’affaires (estimé)
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                    {eur(computed.totals.revenue)}
                  </Typography>
                  <Chip
                    label="Basé sur les lignes vendues"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Commandes contenant tes produits
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                    {Number(computed.totals.orders_count || 0).toLocaleString("fr-FR")}
                  </Typography>
                  <Chip
                    label="Nombre de commandes uniques"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Articles vendus
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                    {Number(computed.totals.items_sold || 0).toLocaleString("fr-FR")}
                  </Typography>
                  <Chip
                    label="Somme des quantités"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Panier moyen (estimé)
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
                    {eur(computed.aov)}
                  </Typography>
                  <Chip
                    label={`${computed.unitsPerOrder.toFixed(2).replace(".", ",")} articles / commande`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Graphe temporel : total des commandes dans le temps (Recharts) */}
            <Paper elevation={1} sx={{ mt: 3, p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Commandes dans le temps
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Évolution du montant des commandes (axe X : date, axe Y : total).
              </Typography>

              {computed.series.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Aucune donnée temporelle disponible. Pour activer ce graphique, l’API doit renvoyer une liste
                  d’ordres (ex: <code>orders</code> avec <code>date</code> et <code>total</code>), ou inclure
                  <code>date</code>/<code>total</code> dans <code>lines</code>.
                </Alert>
              ) : (
                <Box sx={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={computed.series} margin={{ top: 10, right: 16, left: 24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis
                        width={96}
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
                      <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            <Paper elevation={1} sx={{ mt: 3, p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Top produits (par chiffre d’affaires)
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {computed.top.length === 0 ? (
                <Typography color="text.secondary">Aucune vente trouvée pour tes produits.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produit</TableCell>
                      <TableCell align="right">Qté vendue</TableCell>
                      <TableCell align="right">CA estimé</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {computed.top.map((p) => (
                      <TableRow key={p.id_product} hover>
                        <TableCell>{p.name || `Produit #${p.id_product}`}</TableCell>
                        <TableCell align="right">{Number(p.qty_sold || 0).toLocaleString("fr-FR")}</TableCell>
                        <TableCell align="right">{eur(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>

          {/*
            Bloc droit (md=4)
            - Détail des lignes de vente (aperçu)
          */}
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Détail des lignes de vente
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Dernières commandes liées à vos produits.
              </Typography>

              <Stack spacing={1.5}>
                <Chip
                  label={`${Number(state.data?.product_ids?.length || 0).toLocaleString("fr-FR")} produit(s) vendeur`}
                  variant="outlined"
                />
                <Chip
                  label={`${Number(state.data?.lines?.length || 0).toLocaleString("fr-FR")} ligne(s) trouvée(s)`}
                  variant="outlined"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              {Array.isArray(state.data?.lines) && state.data.lines.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Commande</TableCell>
                      <TableCell align="right">Produit</TableCell>
                      <TableCell align="right">Qté</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {state.data.lines.slice(0, 10).map((l) => (
                      <TableRow key={l.id ?? `${l.Id_commande}-${l.id_product}`}>
                        <TableCell>{l.Id_commande ?? l.commande_id ?? "—"}</TableCell>
                        <TableCell align="right">{l.id_product}</TableCell>
                        <TableCell align="right">{l.quantite}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">Aucune ligne de vente à afficher.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}