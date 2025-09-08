export default function Footer({ year }) {
  return (
    <footer style={{ padding: 16, borderTop: "1px solid #eee", marginTop: 24 }}>
      <small>© {year} Marketplace-PSL</small>
    </footer>
  );
}
