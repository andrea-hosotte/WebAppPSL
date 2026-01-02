/**
 * @file Shop.jsx
 * @description
 * Page "Shop" (catalogue produits) — affichage + recherche + préparation à des filtres.
 *
 * Rôle
 * - Récupère la liste des produits via `listProducts()` (service API).
 * - Normalise le shape des produits (tolère différentes conventions de nommage back).
 * - Applique 2 niveaux de filtrage :
 *   1) Filtre via querystring `?q=` (piloté par la Home / barre de recherche globale)
 *   2) Filtre local via champ MUI (recherche instantanée dans la page)
 * - Rend une grille MUI responsive et délègue la UI d’un produit au composant <Product />.
 *
 * Contrat
 * - Props :
 *   - onAdd?: (product: ProductDTO, qty?: number) => void
 *     Utilisé pour ajouter un produit au panier côté App (state global).
 *
 * Notes techniques
 * - `alive` empêche les setState après un unmount (pattern anti-memory leak).
 * - Les logs `[Shop] ...` facilitent le debug réseau (Network + Console).
 */

// React : hooks état/effets
import { useEffect, useState } from "react";
// Services + composants : accès API produits + carte produit
import { listProducts } from "../services/products";
import { Product } from "../components/Product";
// Router : lecture du querystring (?q=...)
import { useLocation } from "react-router-dom";
// MUI : layout, formulaires, feedback de chargement
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
} from "@mui/material";
// Icônes
import SearchIcon from "@mui/icons-material/Search";

// Helper local : expose une API simple pour lire les query params via URLSearchParams.
// Exemple : const q = useQuery().get("q")
const useQuery = () => new URLSearchParams(useLocation().search);

/**
 * Composant page Shop.
 *
 * @param {{ onAdd?: (product: any, qty?: number) => void }} props
 */
export function Shop({ onAdd }) {
  // items : liste normalisée (déjà filtrée par ?q= si présent)
  const [items, setItems] = useState([]);
  // state : état de chargement / erreur (UX)
  const [state, setState] = useState({ loading: true, error: "" });
  // q : filtre global (querystring) — utilisé pour partager une recherche entre pages
  const q = (useQuery().get("q") || "").toLowerCase();
  // localQuery : filtre local (champ de recherche dans la page)
  const [localQuery, setLocalQuery] = useState("");

  useEffect(() => {
    // Effet déclenché à chaque changement de `q` (querystring)
    // 1) charge les produits depuis l’API
    // 2) normalise la structure
    // 3) applique le filtre global ?q=
    let alive = true;
    (async () => {
      setState({ loading: true, error: "" });
      console.log("[Shop] fetching products...");
      try {
        // Appel API : doit renvoyer JSON (tableau ou wrapper {items|data})
        const data = await listProducts();
        console.log("[Shop] raw response:", data);

        // Normalisation : tolère plusieurs noms de colonnes selon l’API/DB
        // Objectif : produire un DTO stable pour la UI
        const arr = Array.isArray(data)
          ? data
          : data?.items || data?.data || [];
        const norm = arr.map((p) => ({
          id: p.id ?? p.Id ?? p.id_produit ?? p.Id_produit,
          name: p.name ?? p.nom ?? p.title ?? "Produit",
          description: p.description ?? p.desc ?? "",
          currency: p.currency ?? p.devise ?? "EUR",
          image_url: p.image_url ?? p.image ?? p.url_image ?? null,
          price:
            typeof p.price_cents === "number"
              ? p.price_cents / 100
              : typeof p.prix_cents === "number"
                ? p.prix_cents / 100
                : Number(p.price ?? p.prix ?? 0),
        }));

        // Filtre global (querystring) : recherche sur name + description
        const visible = q
          ? norm.filter((x) =>
              [x.name, x.description]
                .filter(Boolean)
                .some((s) => s.toLowerCase().includes(q))
            )
          : norm;

        // Protection unmount : on ne met à jour l’état que si le composant est encore monté
        if (alive) {
          setItems(visible);
          setState({ loading: false, error: "" });
        }
      } catch (e) {
        console.error("[Shop] error:", e);
        // Erreur réseau/API : affichage UX + log console pour diagnostic
        if (alive)
          setState({
            loading: false,
            error: e.message || "Erreur de chargement",
          });
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  // UX : skeleton/loader tant que l’API n’a pas répondu
  if (state.loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Chargement des produits…
          </Typography>
        </Stack>
      </Box>
    );
  }
  // UX : message d’erreur explicite si l’API échoue
  if (state.error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 3, borderLeft: "4px solid #ef4444" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Une erreur est survenue
          </Typography>
          <Typography variant="body2" color="error.main">
            {state.error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Filtrage local (en plus du ?q= de l'URL)
  // Permet un affinage instantané sans recharger l’API.
  const visible = localQuery.trim()
    ? items.filter((p) =>
        [p.name, p.description]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(localQuery.toLowerCase()))
      )
    : items;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Nos produits
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visible.length} article(s)
        </Typography>
      </Stack>

      {/*
        Barre d’outils
        - Recherche locale (localQuery)
        - Zone prévue pour tri/filtres (Select)
      */}
      {/* Barre outils (recherche + filtres) */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un produit (nom, description)…"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="rechercher">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="sort-label">Trier par</InputLabel>
              <Select
                labelId="sort-label"
                label="Trier par"
                defaultValue="recent"
              >
                <MenuItem value="recent">Plus récents</MenuItem>
                <MenuItem value="price_asc">Prix croissant</MenuItem>
                <MenuItem value="price_desc">Prix décroissant</MenuItem>
                <MenuItem value="name_asc">Nom A→Z</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Astuce : combine la recherche avec les filtres pour affiner les
          résultats.
        </Typography>
      </Paper>

      {/*
        Grille responsive
        - Les breakpoints contrôlent le nombre de colonnes.
        - <Product /> reçoit un DTO normalisé + callback onAdd.
      */}
      {/* Grille produits */}
      {visible.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Aucun produit ne correspond à votre recherche.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Essayez d’élargir vos filtres.
          </Typography>
        </Paper>
      ) : (
        <Grid
          container
          spacing={3}
          columns={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        >
          {visible.map((p) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={p.id ?? p.name}>
              <Product
                key={p.id ?? p.name}
                id={p.id}
                name={p.name}
                price={p.price}
                currency={p.currency}
                description={p.description}
                image_url={p.image_url}
                onAdd={() => onAdd?.(p, 1)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
