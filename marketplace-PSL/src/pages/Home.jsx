// src/pages/Home.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import shoppingAnimation from "../assets/animation/shopping.json";
import loadingAnimation from "../assets/animation/loading.json";
import chartsAnimation from "../assets/animation/charts.json";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  return (
    <section className="home-grid">
      {/* Colonne gauche : hero + features */}
      <div className="home-left">
        <motion.div
          className="hero"
          initial={{ backgroundPosition: "0% 50%", opacity: 0 }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"], opacity: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
        >
          <motion.div className="hero-content" variants={container} initial="hidden" animate="show">
            <motion.h1 variants={fadeUp}>
              Bienvenue sur <span className="brand">Marketplace-PSL</span>
            </motion.h1>
            <motion.h2 variants={fadeUp}>
              Des produits triés sur le volet, un panier clair et rapide.
            </motion.h2>
            <motion.div
              variants={fadeUp}
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <Link className="cta" to="/produits">
                Voir les produits
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div className="features" variants={container} initial="hidden" animate="show">
          <motion.article
            className="card"
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              width: "100%",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3>Catalogue soigné</h3>
              <p>Une sélection claire pour décider vite.</p>
            </div>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <Lottie animationData={shoppingAnimation} loop autoplay />
            </div>
          </motion.article>

          <motion.article
            className="card"
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              width: "100%",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3>Ajout instantané</h3>
              <p>Le panier se met à jour en temps réel.</p>
            </div>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <Lottie animationData={loadingAnimation} loop autoplay />
            </div>
          </motion.article>

          <motion.article
            className="card"
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              width: "100%",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3>Navigation rapide</h3>
              <p>Une interface fluide et moderne.</p>
            </div>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <Lottie animationData={chartsAnimation} loop autoplay />
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
}
