import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa"; // nécessite: npm i react-icons

export default function Navbar({ cartCount = 0 }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "#fff",
        color: "#111",
        borderBottom: "1px solid #eee",
        zIndex: 1000,
      }}
    >
      {/* Icône panier à gauche */}
      <Link
        to="/panier"
        aria-label="Aller au panier"
        style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      >
        <FaShoppingCart size={20} />
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              left: 10,
              transform: "translateX(100%)",
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "#e11d48", // rouge
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {cartCount}
          </span>
        )}
      </Link>

      {/* Liens centrés et minimalistes */}
      <div style={{ display: "flex", gap: 20, fontSize: 15 }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Accueil</Link>
        <Link to="/produits" style={{ color: "inherit", textDecoration: "none" }}>Produits</Link>
      </div>

      {/* Espace à droite pour équilibrer la mise en page (vide) */}
      <div style={{ width: 24 }} />
    </nav>
  );
}
