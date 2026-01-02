/**
 * @file Catalog.jsx
 * @description
 * Page "Mon catalogue" (profil Professionnel) — gestion CRUD des produits du vendeur.
 *
 * Fonctionnalités
 * - Chargement des produits via `listProducts()` (API `products.php`).
 * - Filtrage côté front :
 *   - par vendeur (id_user / id_seller / seller_id / user_id) == user connecté.
 *   - recherche texte (id, name, reference/ref).
 *   - statut dérivé (stock > 0 => "En ligne", stock <= 0 => "Rupture") + statut API si présent.
 * - Actions :
 *   - Créer / Modifier via `<ProductForm />` (popup) → `onSaved` déclenche un refresh.
 *   - Supprimer via `deleteProduct(id)`.
 *
 * Notes d’architecture
 * - La source de vérité des produits est l’API ; le state `rows` est un cache UI.
 * - Le filtrage vendeur est réalisé côté front ici car l’endpoint `listProducts()` renvoie potentiellement
 *   l’ensemble des produits. Une optimisation consiste à exposer un endpoint server-side filtré par seller.
 *
 * Dépendances
 * - MUI : tableau, filtres, actions.
 * - AuthContext : récupération de `auth.user.id`.
 */
// src/pages/Catalog.jsx
// React : hooks (state + lifecycle)
import { useEffect, useState } from "react";
// UI : Material UI (layout, table, filtres)
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  Button,
  TextField,
} from "@mui/material";
// Auth : contexte (identifiant du vendeur)
import { useAuth } from "../context/AuthContext.jsx";
// Services : appels API produits (liste + suppression)
import { listProducts, deleteProduct } from "../services/products";
// Formulaire produit : création / édition via dialog
import { ProductForm } from "../components/ProductForm.jsx";

/**
 * Page Catalogue (vendeur).
 *
 * Comportement
 * - Au montage et à chaque changement de `userId`, déclenche `refreshProducts()`.
 * - Le tableau affiche `visibleRows` (rows filtrés).
 */
export function Catalog() {
  // Contexte Auth : peut être null si le Provider n'entoure pas l'arbre (défense).
  const { auth } = useAuth() || {};
  // Identifiant du vendeur connecté (utilisé pour filtrer les produits)
  const userId = auth?.user?.id ?? null;

  // State UI
  // - rows      : cache local des produits (après filtrage vendeur)
  // - filters   : filtres saisis (recherche + statut)
  // - state     : loading/error pour l'UX
  // - formOpen  : ouverture du dialog ProductForm
  // - editing   : produit sélectionné pour édition (null => création)
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [state, setState] = useState({ loading: true, error: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Filtrage côté front (recherche texte + statut). La liste `rows` est déjà filtrée par vendeur.
  const visibleRows = rows.filter((p) => {
    // Normalisation des filtres (trim + lowercase)
    const q = (filters.q || "").trim().toLowerCase();
    const status = (filters.status || "").trim().toLowerCase();

    // "Haystack" : concatène plusieurs champs pour une recherche simple (full-text minimaliste)
    const hay = `${p.id ?? ""} ${p.name ?? ""} ${p.reference ?? ""} ${p.ref ?? ""}`.toLowerCase();
    if (q && !hay.includes(q)) return false;

    // Statut : dérivé principalement du stock ; fallback sur `p.status` si l'API fournit une valeur.
    if (status) {
      const stock = Number(p.stock ?? p.quantity ?? 0);
      const apiStatus = String(p.status || "").toLowerCase();

      if (status === "en ligne" || status === "enligne" || status === "online") {
        if (!(stock > 0)) return false;
      } else if (status === "rupture" || status === "out" || status === "outofstock") {
        if (!(stock <= 0)) return false;
      } else if (status === "brouillon" || status === "draft") {
        if (apiStatus !== "brouillon") return false;
      } else {
        // Fallback: si l'utilisateur tape un statut custom, on filtre par inclusion sur p.status
        if (apiStatus && !apiStatus.includes(status)) return false;
      }
    }

    return true;
  });

  // Chargement initial + rechargement si changement d'utilisateur (login/logout/switch)
  useEffect(() => {
    refreshProducts();
  }, [userId]);

  // Suppression : confirmation utilisateur → delete API → synchronisation du cache `rows`
  const handleDelete = async (productId) => {
    if (!productId) return;

    // UX : confirmation avant action destructive
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible."
    );
    if (!confirmDelete) return;

    try {
      // Appel API : supprime côté back
      await deleteProduct(productId);
      // Mise à jour optimiste du cache local (évite un refetch complet)
      setRows((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    } catch (err) {
      console.error("Erreur suppression produit:", err);
      setState((s) => ({
        ...s,
        error: err?.message || "Erreur lors de la suppression du produit",
      }));
    }
  };

  // Fetch produits : appelle `listProducts()`, puis filtre les produits appartenant au vendeur connecté.
  const refreshProducts = async () => {
    // Sans utilisateur connecté : catalogue vide (normalement route protégée)
    if (!userId) {
      setRows([]);
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    try {
      setState({ loading: true, error: "" });

      // Appel API : récupération des produits (potentiellement tous les produits)
      const data = await listProducts();

      // Normalisation : l'API peut renvoyer un tableau direct ou un wrapper `{ items: [...] }`
      const all = Array.isArray(data) ? data : data?.items || [];

      console.log("Catalogue - produits bruts:", all);

      // Filtrage vendeur : compatibilité avec différents noms de colonne selon la DB/API
      const filtered = all.filter((p) => {
        const pid = Number(p.id_user ?? p.id_seller ?? p.seller_id ?? p.user_id);
        return pid === Number(userId);
      });

      setRows(filtered);
      setState({ loading: false, error: "" });
    } catch (err) {
      console.error("Erreur chargement catalogue:", err);
      setState({
        loading: false,
        error: err?.message || "Erreur lors du chargement du catalogue",
      });
    }
  };

  if (state.loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Chargement du catalogue…</Typography>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{state.error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Titre + description */}
      <Typography variant="h4" sx={{ mb: 1 }}>
        Mon catalogue
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Vue détaillée de tous tes produits : prix, stock, statut de mise en ligne.
      </Typography>

      {/* Barre de filtres + actions (recherche, statut, reset, ajout) */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          label="Rechercher un produit"
          placeholder="Nom, référence…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <TextField
          size="small"
          label="Statut"
          placeholder="En ligne, Rupture, Brouillon…"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          inputProps={{ list: "catalog-status-list" }}
        />
        <datalist id="catalog-status-list">
          <option value="En ligne" />
          <option value="Rupture" />
          <option value="Brouillon" />
        </datalist>
        <Box sx={{ flexGrow: 1 }} />
        {(filters.q || filters.status) && (
          <Button
            variant="text"
            onClick={() => setFilters({ q: "", status: "" })}
            sx={{ textTransform: "none" }}
          >
            Réinitialiser
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Ajouter un produit
        </Button>
      </Paper>

      {/* Tableau produits : liste filtrée + actions par ligne */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Réf.</TableCell>
              <TableCell>Produit</TableCell>
              <TableCell align="right">Prix</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              // Empty state : aucun produit après application des filtres
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucun produit ne correspond à ces filtres.
                </TableCell>
              </TableRow>
            ) : (
              // Lignes : rendu des produits + actions Modifier/Supprimer
              visibleRows.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell align="right">
                    {typeof p.price === "number"
                      ? `${p.price.toFixed(2)} €`
                      : `${Number(p.price || 0).toFixed(2)} €`}
                  </TableCell>
                  <TableCell align="right">
                    {p.stock ?? p.quantity ?? 0}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={p.status || (p.stock > 0 ? "En ligne" : "Rupture")}
                      size="small"
                      color={
                        (p.stock ?? p.quantity ?? 0) > 0 ? "success" : "warning"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() => handleDelete(p.id)}
                      >
                        Supprimer
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Les actions de création, modification et suppression de produits sont connectées à l’API.
      </Typography>

      {/* Dialog de création/édition : déclenche un refresh après sauvegarde */}
      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={editing ? "edit" : "create"}
        initialProduct={editing}
        onSaved={async () => {
          await refreshProducts();
        }}
      />
    </Box>
  );
}