import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa"; // icône panier

export function Navbar({ cartCount = 0 }) {
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
        padding: "0 16px",   // 👈 on élargit un peu
        background: "#fff",
        color: "#111",
        borderBottom: "1px solid #eee",
        zIndex: 1000,
        boxSizing: "border-box", // 👈 s’assure que padding est compté
      }}
    >

      <div style={{ display: "flex", gap: 20, fontSize: 15 }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Accueil</Link>
        <Link to="/produits" style={{ color: "inherit", textDecoration: "none" }}>Produits</Link>
      </div>

      {/* Icône panier avec badge */}
            <Link
        to="/panier"
        style={{
          position: "relative",
          color: "#111",
          marginRight: 8, // 👈 petit espace avant le bord
        }}
        aria-label="Panier"
      >
        <FaShoppingCart size={22} />
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -22,
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "#e11d48",
              color: "white",
              fontSize: 12,
              fontWeight: "bold",
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

    </nav>
  );
}
