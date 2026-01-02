/**
 * src/App.jsx
 *
 * Rôle
 * - Point d’entrée applicatif (routing, layout global, transitions, navbar/footer).
 * - Centralise l’état du panier côté front (cartItems) et expose des handlers (add/remove/changeQty).
 * - Applique une stratégie de routage conditionnelle selon le profil utilisateur :
 *   - Particulier : Home / Produits / Panier / Paiement
 *   - Professionnel : Dashboard / Catalogue / Performances
 * - Force la page d’authentification comme route par défaut ("/") tant que l’utilisateur n’est pas connecté.
 *
 * Hypothèses / contrats
 * - AuthContext fournit un objet { auth, setAuth } via useAuth(), où:
 *   - auth.token : vérité d’authentification (présence = utilisateur connecté)
 *   - auth.user  : payload utilisateur (doit inclure raison_soc si routage pro/particulier)
 * - Les composants de pages respectent les props suivantes :
 *   - <Shop onAdd={fn(product)} />
 *   - <Cart items, cartCount, onChangeQty, onRemoveItem, onRemoveMany, onClear />
 *   - <PayWall onOrderCompleted={fn} />
 *
 * Notes
 * - Le compteur panier (cartCount) est dérivé de cartItems pour éviter toute désynchronisation.
 * - Les routes sont encapsulées dans <RequireAuth> pour protéger l’accès après connexion.
 */

// React + Router : navigation, routing et état local
import { useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Animations : transitions de pages (entrée/sortie)
import { AnimatePresence, motion } from "framer-motion";

// UI : layout global (Box/Container) et typographie si nécessaire
import { Box, Container, Typography } from "@mui/material";

// Auth : contexte, garde-fous de routes publiques/privées
import { useAuth } from "./context/AuthContext.jsx";
import { PublicOnly } from "./routes/PublicOnly.jsx";
import { RequireAuth } from "./routes/RequireAuth.jsx";

// Composants UI globaux
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

// Pages (routes)
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Cart } from "./pages/Cart";
import { Auth } from "./pages/Auth.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { Performances } from "./pages/Performances.jsx";
import { PayWall } from "./pages/PayWall.jsx";

// Variants Framer Motion : animation standardisée entre les pages
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
  // État du panier côté front : tableau de lignes { id, name, price, qty, ... }
  // NB : ce panier n’est pas persistant (refresh navigateur = panier vidé) tant qu’aucun storage n’est ajouté.
  const [cartItems, setCartItems] = useState([]);

  /**
   * changeQty(id, delta)
   * - Ajuste la quantité d’une ligne du panier.
   * - delta peut être positif (ajout) ou négatif (retrait).
   * - La quantité est clampée à >= 0 et la ligne est supprimée si qty retombe à 0.
   * - L’identifiant de ligne est (x.id ?? x.name) pour tolérer des produits sans id côté API.
   */
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
          .filter((x) => Number(x.qty || 1) > 0) 
    );
  };

  /**
   * removeItem(id)
   * - Supprime une ligne du panier par identifiant (id ou name fallback).
   */
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((x) => (x.id ?? x.name) !== id));
  };

  /**
   * removeMany(ids)
   * - Supprime plusieurs lignes en une seule mise à jour d’état.
   * - Normalise les ids en string pour gérer des id numériques/hétérogènes.
   */
  const removeMany = (ids = []) => {
    if (!ids.length) return;
    const setIds = new Set(ids.map(String));
    setCartItems((prev) =>
      prev.filter((x) => !setIds.has(String(x.id ?? x.name)))
    );
  };

  /**
   * clearCart()
   * - Vide entièrement le panier (utile post-commande / post-paiement).
   */
  const clearCart = () => setCartItems([]);

  /**
   * cartCount (dérivé)
   * - Somme des quantités du panier. Dérivé de cartItems pour garantir la cohérence.
   */
  const cartCount = useMemo(
    () => cartItems.reduce((n, it) => n + Number(it.qty || 1), 0),
    [cartItems]
  );

  /**
   * handleAdd(product)
   * - Ajoute un produit au panier ou incrémente sa quantité si déjà présent.
   * - Contrat minimal attendu sur product : { id?, name, price? }
   * - Normalise la donnée pour usage UI (image_url, description, price numérique).
   */
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

  // location : utilisé comme key des <Routes> pour forcer AnimatePresence à rejouer les animations
  const location = useLocation();

  // useAuth() peut temporairement renvoyer null/undefined si le Provider n’entoure pas l’arbre.
  // Le fallback {} évite un crash immédiat, mais il faut s’assurer que <AuthProvider> est bien en amont (main.jsx).
  const { auth, setAuth } = useAuth() || {};

  console.log("App render, auth =", auth);

  // Routage conditionnel : on bascule en mode “Pro” selon la raison sociale renvoyée par l’API
  const raisonSoc = auth?.user?.raison_soc;
  const isPro =
    typeof raisonSoc === "string" &&
    raisonSoc.toLowerCase().startsWith("profession");

  // console.log("Utilisateur connecté :", auth?.user?.email, "Raison sociale :", raisonSoc);
  return (
    <Box sx={{ fontFamily: "system-ui, sans-serif" }}>
      {/*
        Navbar
        - Affichée uniquement si l’utilisateur est authentifié (auth.token).
        - Reçoit cartCount (badge panier) et isPro (menu pro vs particulier).
      */}
      {auth?.token && <Navbar cartCount={cartCount} isPro={isPro} />}

      <Box component="main" sx={{ mt: auth?.token ? 7 : 0 }}>
        {/*
          Container pleine largeur
          - maxWidth={false} + disableGutters permet aux sections (ex: Hero) d’utiliser toute la largeur.
          - Les pages peuvent ensuite gérer leur propre centrage via leurs containers internes.
        */}
        <Container maxWidth={false} disableGutters>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/*
                Route par défaut : Auth
                - Toujours "/" (landing) afin de forcer l’authentification.
                - PublicOnly empêche d’afficher Auth si déjà connecté (redirection gérée dans PublicOnly).
              */}
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

              {isPro ? (
                // === Routes pour les utilisateurs Professionnels ===
                <>
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
                          <Dashboard />
                        </motion.div>
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="/catalogue"
                    element={
                      <RequireAuth>
                        <motion.div
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Catalog />
                        </motion.div>
                      </RequireAuth>
                    }
                  />

                  <Route
                    path="/performances"
                    element={
                      <RequireAuth>
                        <motion.div
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Performances />
                        </motion.div>
                      </RequireAuth>
                    }
                  />
                </>
              ) : (
                // === Routes pour les Particuliers (Marketplace classique) ===
                <>
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

                  <Route
                    path="/paywall"
                    element={
                      <RequireAuth>
                        <motion.div
                          variants={pageVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <PayWall onOrderCompleted={clearCart} />
                        </motion.div>
                      </RequireAuth>
                    }
                  />
                </>
              )}

              {/*
                Fallback
                - Toute route inconnue redirige vers "/" (page d’auth), pour éviter des états non gérés.
              */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Container>

        {/*
          Footer
          - Toujours affiché (même si non connecté).
          - Si vous souhaitez le masquer sur Auth, conditionnez-le sur auth?.token.
        */}
        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 4, py: 2 }}>
          <Container maxWidth="lg">
            <Footer year={new Date().getFullYear()} />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
