import { useState } from 'react'
import Header from "./components/Header";
import Product from "./components/Product";
import Footer from "./components/Footer";
import './App.css'

function App() {
  const [cartCount, setCartCount] = useState(0);

  const handleAdd = () => setCartCount((c) => c + 1);

  const products = [
    { id: 1, name: "Clavier", price: 89.9 },
    { id: 2, name: "Souris sans fil", price: 39.9 },
    { id: 3, name: "Casque audio", price: 129.0 },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <Header title={`Marketplace-PSL — Panier: ${cartCount}`} />

      <main style={{ marginTop: 16 }}>
        {products.map((p) => (
          <Product
            key={p.id}
            name={p.name}
            price={p.price}
            onAdd={handleAdd}
          />
        ))}
      </main>

      <Footer year={new Date().getFullYear()} />
    </div>
  );
}

export default App
