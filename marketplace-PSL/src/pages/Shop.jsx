// src/pages/Shop.jsx
import { useEffect, useState } from "react";
import { Product } from "../components/Product";
import { listProducts } from "../services/products";

export function Shop({ onAdd }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    (async () => {
      try {
        function normalizeProductsResponse(data) {
          // Cas 1: API renvoie directement un tableau
          if (Array.isArray(data)) return data;

          // Cas 2: API renvoie un objet avec { items: [...] } ou { data: [...] }
          if (data && typeof data === "object") {
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.data)) return data.data;
            if (data.error || data.message) {
              // Propage une erreur explicite si l'API a renvoyé un objet d'erreur en 200
              const msg = data.message || data.error || "Réponse d'erreur API";
              throw new Error(msg);
            }
          }

          // Cas 3: chaîne (souvent HTML d’erreur)
          if (typeof data === "string") {
            if (data.trim().startsWith("<!DOCTYPE") || data.includes("<html")) {
              throw new Error(
                "L’API a renvoyé une page HTML (probable erreur Apache/CORS/404)."
              );
            }
          }

          // Rien d'utilisable → tableau vide
          return [];
        }

        // On normalise : l’API renvoie [{ id, name, price_cents, currency, description, image_url, ... }]
        const data = await listProducts();
        const raw = normalizeProductsResponse(data);

        const mapped = raw.map((p) => ({
          id: p.id,
          name: p.name,
          price:
            typeof p.price_cents === "number"
              ? p.price_cents / 100
              : Number(p.price) || 0,
          currency: p.currency || "EUR",
          description: p.description || "",
          image_url: p.image_url || null,
        }));
        setItems(mapped);
      } catch (e) {
        console.log(e);
        setState((s) => ({
          ...s,
          error: e?.message || "Erreur de chargement des produits",
        }));
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  if (state.loading) return <p>Chargement…</p>;
  if (state.error) return <p style={{ color: "crimson" }}>{state.error}</p>;
  if (items.length === 0) return <p>Aucun produit disponible.</p>;

  return (
    <>
      <h2>Nos produits</h2>
      {items.map((p) => (
        <Product
          key={p.id}
          name={p.name}
          price={p.price}
          imageUrl={p.image_url}
          onAdd={() => onAdd?.(p)} // on passe le produit si tu veux l’exploiter
        />
      ))}
    </>
  );
}
