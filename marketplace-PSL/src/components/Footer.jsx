// src/components/Footer.jsx
export function Footer({ year = new Date().getFullYear() }) {
  return (
    <footer style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 12 }}>
      <small>© {year} Marketplace-PSL</small>
    </footer>
  );
}
