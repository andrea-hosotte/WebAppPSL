// src/components/Product.jsx
import { useState } from "react";

export function Product({ name, price, imageUrl, onAdd, currency = "€" }) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr auto",
        alignItems: "center",
        gap: 12,
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        background: "#573f3fff",
      }}
    >
      {/* Zone image */}
      <div
        style={{
          width: 120,
          height: 90,
          borderRadius: 8,
          overflow: "hidden",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #eee",
        }}
      >
        {imageUrl && !broken ? (
          <img
            src={imageUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setBroken(true)}
          />
        ) : (
          // Fallback si pas d'image ou erreur de chargement
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", padding: 8 }}>
            Pas d’image
          </div>
        )}
      </div>

      {/* Infos produit */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{name}</div>
        <div style={{ opacity: 0.85 }}>
          {price?.toFixed ? price.toFixed(2) : Number(price).toFixed(2)} {currency}
        </div>
      </div>

      {/* Action */}
      <button onClick={() => (typeof onAdd === "function" ? onAdd() : null)}>
        Ajouter
      </button>
    </div>
  );
}
