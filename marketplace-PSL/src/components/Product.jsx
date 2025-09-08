export default function Product({ name, price, onAdd }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 8px" }}>{name}</h3>
      <p style={{ margin: "0 0 12px" }}>{price.toFixed(2)} €</p>
      <button onClick={onAdd}>Ajouter au panier</button>
    </div>
  );
}
