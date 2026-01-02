/**
 * @file PaymentForm.jsx
 * @description
 * Composant de paiement (UI) + création de commande (API).
 *
 * Objectif
 * - Collecter des informations de paiement (mock) côté front.
 * - Construire le payload attendu par `POST /api/order.php`.
 * - Déclencher la création de la commande côté back.
 * - Remonter le résultat au parent via `onPaid` (navigation, notification, vidage panier).
 *
 * IMPORTANT (sécurité)
 * - Ce formulaire ne réalise pas un paiement réel (aucune intégration PSP type Stripe).
 * - Ne jamais manipuler de données carte bancaires réelles en production sans PSP conforme PCI-DSS.
 */
// React : state local du formulaire
import { useState } from "react";
// UI : composants Material UI (layout + champs)
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

/**
 * Formulaire de paiement.
 *
 * Contrat
 * - `total`  : montant total du panier (number) — unité attendue côté API (euros).
 * - `items`  : lignes du panier (au minimum `{ id, price, qty }`).
 * - `userId` : identifiant de l'utilisateur connecté (FK vers users).
 * - `onPaid` : callback après succès (peut : afficher une notification, vider panier, naviguer).
 *
 * Payload envoyé à l'API `order.php`
 * ```json
 * {
 *   "user_id": 3,
 *   "lines": [ { "id": 101, "qty": 2, "price": 19.9 } ],
 *   "total": 39.8
 * }
 * ```
 * Notes
 * - La normalisation des quantités supporte les deux conventions : `qty` ou `quantity`.
 * - Le back doit recalculer et valider le total (ne jamais faire confiance au front).
 */

/**
 * @param {object} props
 * @param {number} props.total
 * @param {Array<{id:number|string,name?:string,price:number,qty?:number,quantity?:number}>} [props.items]
 * @param {number|string} props.userId
 * @param {(result: any) => (void|Promise<void>)} [props.onPaid]
 */
export function PaymentForm({ total, items = [], userId, onPaid }) {
  // State formulaire : champs de paiement (mock).
  // Remarque : on conserve ces champs en clair uniquement car il s'agit d'un prototype.
  const [form, setForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  // State UX : loading + message d'erreur (validation front ou erreur API)
  const [state, setState] = useState({ loading: false, error: "" });

  // Handler générique : met à jour un champ du formulaire (inputs contrôlés)
  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  // Submit : validation minimale → construction du payload → POST vers l'API → callback parent
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation front (minimaliste) : évite l'appel réseau si champs vides.
    if (!form.cardName || !form.cardNumber || !form.expiry || !form.cvc) {
      setState({
        loading: false,
        error: "Tous les champs de paiement sont obligatoires.",
      });
      return;
    }

    // Garde-fou : l'utilisateur doit être authentifié pour créer une commande.
    if (!userId) {
      setState({
        loading: false,
        error: "Utilisateur non identifié : veuillez vous reconnecter.",
      });
      return;
    }

    // Garde-fou panier : pas de checkout si panier vide ou total invalide.
    if (!items.length || !total) {
      setState({
        loading: false,
        error: "Panier vide ou total invalide.",
      });
      return;
    }

    setState({ loading: true, error: "" });

    try {
      // Normalisation des lignes : on produit la structure attendue par `order.php`.
      // - `qty` prioritaire, fallback `quantity`, sinon 1.
      const lines = items.map((item) => ({
        id: item.id,
        qty: item.qty ?? item.quantity ?? 1,
        price: item.price,
      }));

      const payload = {
        user_id: userId,
        lines,
        total,
      };

      // Appel API : création commande + lignes (compose_commande) côté serveur.
      const res = await fetch("http://localhost/api/order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // HTTP non-2xx : on remonte un message générique (le détail est côté server logs).
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Le back renvoie un JSON de forme `{ ok: boolean, ... }`.
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Échec de la commande");
      }

      // Succès : délègue au parent (ex: notification, navigation, vidage panier).
      if (onPaid) {
        await onPaid(data);
      }

      setState({ loading: false, error: "" });
    } catch (err) {
      console.error("Erreur paiement / commande:", err);
      setState({
        loading: false,
        error: err?.message || "Erreur pendant le paiement / la commande",
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {/* Titre de section */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Paiement sécurisé
      </Typography>

      {/* Form fields */}
      <Stack spacing={2}>
        <TextField
          label="Nom sur la carte"
          fullWidth
          value={form.cardName}
          onChange={handleChange("cardName")}
          required
        />
        <TextField
          label="Numéro de carte"
          fullWidth
          value={form.cardNumber}
          onChange={handleChange("cardNumber")}
          required
          placeholder="4242 4242 4242 4242"
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Expiration (MM/AA)"
            value={form.expiry}
            onChange={handleChange("expiry")}
            required
            fullWidth
          />
          <TextField
            label="CVC"
            value={form.cvc}
            onChange={handleChange("cvc")}
            required
            fullWidth
          />
        </Stack>

        <Divider />

        {/* Récapitulatif montant */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">Total à payer</Typography>
          <Typography variant="h6" fontWeight={700}>
            {Number(total || 0).toFixed(2)} €
          </Typography>
        </Box>

        {/* Feedback : erreur validation / API */}
        {state.error && (
          <Typography color="error" variant="body2">
            {state.error}
          </Typography>
        )}

        {/* Action principale : déclenche la création de commande via order.php */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={state.loading}
        >
          {state.loading ? "Paiement en cours..." : "Payer et valider la commande"}
        </Button>
      </Stack>
    </Box>
  );
}