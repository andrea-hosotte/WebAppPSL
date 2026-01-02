/**
 * @file Product.jsx
 * @description
 * Composant UI représentant une fiche produit (Product Card).
 *
 * Rôle
 * - Affiche les informations principales d’un produit (image, nom, description, prix).
 * - Fournit une action principale "Ajouter" pour intégrer le produit au panier.
 *
 * Contexte d’utilisation
 * - Utilisé dans les pages publiques (Shop / Marketplace).
 * - Réutilisable dans d’autres contextes (catalogue vendeur, recommandations, etc.).
 *
 * Philosophie
 * - Composant purement présentational (stateless).
 * - Toute la logique métier (panier, stock, commandes) est déléguée au parent via `onAdd`.
 */
// src/components/Product.jsx

// UI : composants Material UI pour la carte produit
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";

/**
 * Carte Produit.
 *
 * @param {object} props
 * @param {number|string} props.id - Identifiant unique du produit (référence).
 * @param {string} props.name - Nom du produit.
 * @param {number} props.price - Prix du produit (en euros).
 * @param {string} [props.currency="EUR"] - Devise d’affichage.
 * @param {string} [props.description] - Description courte du produit.
 * @param {string|null} [props.image_url] - URL de l’image du produit.
 * @param {(product: object) => void} [props.onAdd] - Callback appelé lors de l’ajout au panier.
 */
export function Product({
  id,
  name,
  price,
  currency = "EUR",
  description = "",
  image_url,
  onAdd,
}) {
  // Formatage du prix : sécurise l’affichage si la valeur est absente ou invalide
  const priceLabel = isFinite(price)
    ? `${price.toFixed(2)} ${currency}`
    : `— ${currency}`;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Zone média : image produit ou placeholder si absente */} 
      {image_url ? (
        <CardMedia
          component="img"
          src={image_url}
          alt={name}
          sx={{ height: 180, objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            height: 180,
            bgcolor: "grey.100",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Aucune image
          </Typography>
        </Box>
      )}

      {/* Contenu principal : nom, description et référence produit */} 
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description || "—"}
          </Typography>
          {/* Référence produit : affichée uniquement si l’id est fourni */} 
          {id && (
            <Typography variant="caption" color="text.secondary">
              Réf. produit : {id}
            </Typography>
          )}
        </Stack>
      </CardContent>

      {/* Actions : prix + bouton d’ajout au panier */} 
      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>{priceLabel}</Typography>
        {/* Action "Ajouter" : délègue la gestion du panier au composant parent */} 
        <Button
          variant="contained"
          onClick={() =>
            // Transmission des données produit minimales au panier
            onAdd?.({ id, name, price, currency, description, image_url })
          }
        >
          Ajouter
        </Button>
      </CardActions>
    </Card>
  );
}
