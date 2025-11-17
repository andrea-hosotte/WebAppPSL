const BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost/api";

export async function listProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/products.php${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}