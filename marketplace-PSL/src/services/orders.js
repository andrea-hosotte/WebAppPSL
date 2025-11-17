// src/services/orders.js
const BASE = (import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "")) || "http://localhost/api";

export async function createOrder({ userId, lines, total }) {
  const res = await fetch(`${BASE}/order.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      user_id: userId,
      lines: lines.map(l => ({
        id: l.id ?? l.product_id ?? l.name, // robustesse
        qty: Number(l.qty || 1),
        price: Number(l.price || 0),
      })),
      total,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}