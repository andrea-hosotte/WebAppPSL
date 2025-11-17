import { useEffect, useState } from "react";
import { listProducts } from "../services/products";
import { Product } from "../components/Product";
import { useLocation } from "react-router-dom";

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
import SearchIcon from "@mui/icons-material/Search";

const useQuery = () => new URLSearchParams(useLocation().search);

export function Shop({ onAdd }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });
  const q = (useQuery().get("q") || "").toLowerCase();

  const [localQuery, setLocalQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setState({ loading: true, error: "" });
      console.log("[Shop] fetching products...");
      try {
        const data = await listProducts();
        console.log("[Shop] raw response:", data);

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

        const visible = q
          ? norm.filter((x) =>
              [x.name, x.description]
                .filter(Boolean)
                .some((s) => s.toLowerCase().includes(q))
            )
          : norm;

        if (alive) {
          setItems(visible);
          setState({ loading: false, error: "" });
        }
      } catch (e) {
        console.error("[Shop] error:", e);
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

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="filter-label">Catégorie</InputLabel>
              <Select
                labelId="filter-label"
                label="Catégorie"
                defaultValue="all"
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="accessoires">Accessoires</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="informatique">Informatique</MenuItem>
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
