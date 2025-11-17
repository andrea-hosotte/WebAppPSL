// src/components/Product.jsx
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

export function Product({
  id,
  name,
  price,
  currency = "EUR",
  description = "",
  image_url,
  onAdd,
}) {
  const priceLabel = isFinite(price)
    ? `${price.toFixed(2)} ${currency}`
    : `— ${currency}`;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description || "—"}
          </Typography>
          {id && (
            <Typography variant="caption" color="text.secondary">
              Réf. produit : {id}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>{priceLabel}</Typography>
        <Button
          variant="contained"
          onClick={() =>
            onAdd?.({ id, name, price, currency, description, image_url })
          }
        >
          Ajouter
        </Button>
      </CardActions>
    </Card>
  );
}
