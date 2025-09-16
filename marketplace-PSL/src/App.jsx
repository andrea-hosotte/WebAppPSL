import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Cart } from "./pages/Cart";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeInOut" } }
};

export function App() {
  const [cartCount, setCartCount] = useState(0);
  const handleAdd = () => setCartCount((c) => c + 1);
  const location = useLocation();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <Navbar cartCount={cartCount} />
      <div style={{ marginTop: 56, padding: 24 }}>
        <Header />
        <main style={{ marginTop: 16 }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <Home />
                  </motion.div>
                }
              />
              <Route
                path="/produits"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <Shop onAdd={handleAdd} />
                  </motion.div>
                }
              />
              <Route
                path="/panier"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <Cart cartCount={cartCount} />
                  </motion.div>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer year={new Date().getFullYear()} />
      </div>
    </div>
  );
}
