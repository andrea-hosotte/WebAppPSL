import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Product from "./components/Product";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./App.css";

export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const handleAdd = () => setCartCount((c) => c + 1);

  const products = [
    { id: 1, name: "Clavier", price: 89.9 },
    { id: 2, name: "Souris sans fil", price: 39.9 },
    { id: 3, name: "Casque audio", price: 129.0 },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <Navbar cartCount={cartCount} />
      {/* marge sous la navbar fixe */}
      <div style={{ marginTop: 56, padding: 24 }}>
        <Header title={`Marketplace-PSL — Panier: ${cartCount}`} />

        <main style={{ marginTop: 16 }}>
          <Routes>
            <Route path="/" element={<h2>Bienvenue sur l’accueil 🚀</h2>} />
            <Route
              path="/produits"
              element={
                <>
                  {products.map((p) => (
                    <Product
                      key={p.id}
                      name={p.name}
                      price={p.price}
                      onAdd={handleAdd}
                    />
                  ))}
                </>
              }
            />
            <Route
              path="/panier"
              element={<h2>Votre panier contient {cartCount} article(s) 🛒</h2>}
            />
          </Routes>
        </main>

        <Footer year={new Date().getFullYear()} />
      </div>
    </div>
  );
}
