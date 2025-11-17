// src/App.jsx — simplified
import { useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Container } from "@mui/material";

// Auth
import { useAuth } from "./context/AuthContext.jsx";
import { PublicOnly } from "./routes/PublicOnly.jsx";
import { RequireAuth } from "./routes/RequireAuth.jsx";

// UI
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

// Pages
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Cart } from "./pages/Cart";
import { Auth } from "./pages/Auth.jsx";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

export function App() {
  // Panier côté front
  const [cartItems, setCartItems] = useState([]);

  /** Ajout (supporte qty négative/positive, par défaut +1) */
  const addToCart = (item, qty = 1) => {
    if (!item) return;
    const id = item.id ?? item.name;
    setCartItems((prev) => {
      const i = prev.findIndex((x) => (x.id ?? x.name) === id);
      if (i >= 0) {
        const copy = [...prev];
        const nextQty = Math.max(
          0,
          Number(copy[i].qty || 1) + Number(qty || 0)
        );
        if (nextQty === 0) {
          // suppression si qty tombe à 0
          copy.splice(i, 1);
          return copy;
        }
        copy[i] = { ...copy[i], qty: nextQty };
        return copy;
      }
      // si qty <= 0 on n’ajoute rien
      if (qty <= 0) return prev;
      return [...prev, { ...item, qty: Number(qty) }];
    });
  };

  /** Incrémente/décrémente une ligne par id (delta peut être -1, +1, etc.) */
  const changeQty = (id, delta) => {
    if (!id || !delta) return;
    setCartItems(
      (prev) =>
        prev
          .map((x) =>
            (x.id ?? x.name) === id
              ? { ...x, qty: Math.max(0, Number(x.qty || 1) + Number(delta)) }
              : x
          )
          .filter((x) => Number(x.qty || 1) > 0) // supprime si 0
    );
  };

  /** Fixe la quantité absolue (utile si tu ajoutes un <input>) */
  const setQty = (id, qty) => {
    setCartItems((prev) =>
      prev
        .map((x) =>
          (x.id ?? x.name) === id
            ? { ...x, qty: Math.max(0, Number(qty || 0)) }
            : x
        )
        .filter((x) => Number(x.qty || 1) > 0)
    );
  };

  /** Supprime une ligne par id */
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((x) => (x.id ?? x.name) !== id));
  };

  /** Supprime plusieurs lignes d’un coup */
  const removeMany = (ids = []) => {
    if (!ids.length) return;
    const setIds = new Set(ids.map(String));
    setCartItems((prev) =>
      prev.filter((x) => !setIds.has(String(x.id ?? x.name)))
    );
  };

  /** Vide tout */
  const clearCart = () => setCartItems([]);

  /** Compteur dérivé du state (toujours juste) */
  const cartCount = useMemo(
    () => cartItems.reduce((n, it) => n + Number(it.qty || 1), 0),
    [cartItems]
  );

  const handleAdd = (product) => {
    setCartItems((prev) => {
      const key = product.id ?? product.name;
      const found = prev.find((p) => (p.id ?? p.name) === key);
      if (found) {
        return prev.map((p) =>
          (p.id ?? p.name) === key ? { ...p, qty: (p.qty || 1) + 1 } : p
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image_url: product.image_url || product.imageUrl || null,
          description: product.description || "",
          qty: 1,
        },
      ];
    });
  };

  const location = useLocation();
  const { auth } = useAuth();

  return (
    <Box sx={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Navbar visible uniquement si connecté */}
      {auth?.token && <Navbar cartCount={cartCount} />}

      <Box component="main" sx={{ mt: auth?.token ? 7 : 0 }}>
        {/* Pleine largeur pour permettre un Hero full-width */}
        <Container maxWidth={false} disableGutters>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Page d’auth publique, accessible uniquement si NON connecté */}
              <Route
                path="/"
                element={
                  <PublicOnly>
                    <motion.div
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Auth />
                    </motion.div>
                  </PublicOnly>
                }
              />

              {/* Routes privées */}
              <Route
                path="/home"
                element={
                  <RequireAuth>
                    <motion.div
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Home />
                    </motion.div>
                  </RequireAuth>
                }
              />

              <Route
                path="/produits"
                element={
                  <RequireAuth>
                    <motion.div
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Shop onAdd={handleAdd} />
                    </motion.div>
                  </RequireAuth>
                }
              />

              <Route
                path="/panier"
                element={
                  <RequireAuth>
                    <motion.div
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Cart
                        items={cartItems}
                        cartCount={cartCount}
                        onChangeQty={changeQty}
                        onRemoveItem={removeItem}
                        onRemoveMany={removeMany}
                        onClear={clearCart}
                      />
                    </motion.div>
                  </RequireAuth>
                }
              />

              {/* Toute autre route → Auth */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Container>

        {/* Footer */}
        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 4, py: 2 }}>
          <Container maxWidth="lg">
            <Footer year={new Date().getFullYear()} />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
