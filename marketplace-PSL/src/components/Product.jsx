export function Product({ name, price, onAdd }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 600 }}>{name}</div>
      <div style={{ margin: "8px 0" }}>{price.toFixed(2)} €</div>
      <button onClick={() => (typeof onAdd === "function" ? onAdd() : null)}>
        Ajouter au panier
      </button>
    </div>
  );
}
