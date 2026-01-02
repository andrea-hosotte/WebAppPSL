/**
 * @file ProductForm.jsx
 * @description
 * Dialog (MUI) de création / édition de produit.
 *
 * Rôle
 * - Fournit un formulaire unique pour :
 *   - créer un produit (mode = "create")
 *   - modifier un produit existant (mode = "edit")
 * - Délègue les appels HTTP au service `services/products`.
 * - Associe systématiquement le produit à un vendeur (`id_seller`) à partir du contexte d'auth.
 *
 * Contrat API (attendu)
 * - `createProduct(payload)`  → POST /api/products.php
 * - `updateProduct(id, payload)` → PUT /api/products.php?id=...
 *
 * Champs (payload)
 * - name: string (obligatoire)
 * - description: string (optionnel)
 * - price: number (obligatoire) — ici en euros (float). Si votre back attend des centimes,
 *   faire la conversion côté front ou côté PHP (ex: Math.round(price * 100)).
 * - stock: number (>=0)
 * - image_url: string|null
 * - id_seller: number (obligatoire) — FK vers users.id (vendeur)
 *
 * UX
 * - Pré-remplit les champs en mode "edit".
 * - Réinitialise les champs en mode "create".
 * - Empêche la fermeture pendant un enregistrement (state.loading).
 */
// src/components/ProductFormDialog.jsx

// React : hooks (state + lifecycle)
import { useEffect, useState } from "react";
// UI : Material UI (dialog + champs)
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Button,
  Box,
  Typography,
} from "@mui/material";
// Services : appels API produits (création / mise à jour)
import { createProduct, updateProduct } from "../services/products";
// Auth : contexte (identifiant vendeur) — requis pour rattacher le produit au bon seller
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Composant formulaire Produit.
 *
 * @param {object} props
 * @param {boolean} props.open - Ouvre/ferme la popup.
 * @param {() => void} [props.onClose] - Callback de fermeture (annuler ou après succès).
 * @param {"create"|"edit"} [props.mode="create"] - Mode d'utilisation.
 * @param {object|null} [props.initialProduct=null] - Produit initial (mode edit).
 * @param {(product: any) => void} [props.onSaved] - Callback après succès (ex: refresh liste Catalog).
 */
export function ProductForm({
  open,
  onClose,
  mode = "create",
  initialProduct = null,
  onSaved,
}) {
  // Contexte d’authentification : doit contenir l'utilisateur connecté.
  // Défense : `useAuth()` peut être null si le Provider n'entoure pas l'arbre.
  const { auth } = useAuth() || {};
  // Identifiant vendeur : utilisé pour renseigner `id_seller` côté API.
  const sellerId = auth?.user?.id ?? null;
  // Mode courant : simplifie les branches create/edit.
  const isEdit = mode === "edit";

  // State formulaire : valeurs contrôlées des champs.
  // Note : `price` et `stock` sont stockés en string côté UI, puis convertis en Number dans le payload.
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
  });

  // State UX : chargement + message d'erreur (validation front ou erreur API).
  const [state, setState] = useState({
    loading: false,
    error: "",
  });

  // Hydratation du formulaire
  // - En mode edit : pré-remplit depuis `initialProduct`.
  // - En mode create : reset des champs lors de l'ouverture.
  // Dépendances :
  // - `open` : ne déclenche l'hydratation qu'à l'ouverture.
  // - `initialProduct` : supporte le changement de produit sélectionné.
  // - `isEdit` : bascule create/edit.
  useEffect(() => {
    if (open && initialProduct && isEdit) {
      setForm({
        name: initialProduct.name || "",
        description: initialProduct.description || "",
        price:
          typeof initialProduct.price === "number"
            ? initialProduct.price.toString()
            : initialProduct.price || "",
        stock:
          initialProduct.stock != null
            ? String(initialProduct.stock)
            : "",
        image_url: initialProduct.image_url || "",
      });
    } else if (open && !isEdit) {
      // reset en mode création
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        image_url: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialProduct, isEdit]);

  // Handler générique : met à jour un champ du formulaire (pattern controlled inputs)
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  // Soumission : validation minimale → construction du payload → appel service create/update.
  // Note : en MUI, le bouton peut déclencher `onClick={handleSubmit}` ou un vrai submit du form.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Garde-fou : on exige un vendeur (id_seller) pour la création/édition.
    // Normalement, la route est protégée côté front (RequireAuth), mais on sécurise.
    if (!sellerId) {
      setState({
        loading: false,
        error: "Impossible de déterminer le vendeur (utilisateur non connecté).",
      });
      return;
    }

    // Validation front : nom obligatoire
    if (!form.name.trim()) {
      setState({ loading: false, error: "Le nom du produit est obligatoire." });
      return;
    }
    // Validation front : prix obligatoire
    if (!form.price) {
      setState({ loading: false, error: "Le prix est obligatoire." });
      return;
    }

    setState({ loading: true, error: "" });

    try {
      // Payload API : conversion et normalisation des champs.
      // IMPORTANT : `price` est ici en euros (float). Adapter si la DB/back stocke en centimes.
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        // on convertit en nombre (tu adapteras côté PHP si tu es en centimes)
        price: Number(form.price),
        stock: form.stock !== "" ? Number(form.stock) : 0,
        image_url: form.image_url.trim() || null,
        id_seller: sellerId, // très important : on rattache au user connecté
      };

      // Branche edit : nécessite un id produit.
      // Branche create : POST d'un nouveau produit.
      let result;
      if (isEdit && initialProduct?.id) {
        result = await updateProduct(initialProduct.id, payload);
      } else {
        result = await createProduct(payload);
      }

      setState({ loading: false, error: "" });

      // Remonte le résultat au parent (ex: Catalog) pour rafraîchir la liste.
      if (onSaved) onSaved(result);

      // Fermeture après succès : laisse au parent la responsabilité de fermer le dialog.
      if (onClose) onClose();
    } catch (err) {
      console.error("Erreur sauvegarde produit:", err);
      setState({
        loading: false,
        error: err?.message || "Erreur lors de la sauvegarde du produit",
      });
    }
  };

  // Fermeture : bloque si une requête est en cours pour éviter des états incohérents.
  const handleClose = () => {
    // Empêche la fermeture pendant l'enregistrement.
    if (state.loading) return;
    setState({ loading: false, error: "" });
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Titre dynamique selon mode (create/edit) */}
      <DialogTitle>
        {isEdit ? "Modifier le produit" : "Ajouter un produit"}
      </DialogTitle>

      {/* Contenu : formulaire contrôlé (TextField) */}
      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Champs principaux : nom + description */}
          <TextField
            label="Nom du produit"
            value={form.name}
            onChange={handleChange("name")}
            required
            fullWidth
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange("description")}
            fullWidth
            multiline
            minRows={3}
          />

          {/* Groupe : prix + stock (responsive) */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Prix (€)"
              value={form.price}
              onChange={handleChange("price")}
              required
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              fullWidth
            />
            <TextField
              label="Stock"
              value={form.stock}
              onChange={handleChange("stock")}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
          </Stack>

          {/* Image : URL optionnelle (affichage côté ProductCard et/ou modal détail) */}
          <TextField
            label="URL de l'image"
            value={form.image_url}
            onChange={handleChange("image_url")}
            fullWidth
            placeholder="https://…"
          />

          {/* Feedback : message d'erreur (validation ou API) */}
          {state.error && (
            <Typography color="error" variant="body2">
              {state.error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        {/* Actions : annuler / enregistrer */}
        <Button onClick={handleClose} disabled={state.loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={state.loading}
        >
          {state.loading
            ? "Enregistrement…"
            : isEdit
            ? "Enregistrer les modifications"
            : "Créer le produit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}