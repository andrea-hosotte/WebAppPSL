export default function Header({ title }) {
  return (
    <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
      <h1>{title}</h1>
    </header>
  );
}
