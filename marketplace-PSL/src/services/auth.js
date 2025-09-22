// src/services/auth.js
const API = "http://localhost/api"; // Apache (XAMPP), pas 5174

export async function registerUser(payload) {
  const r = await fetch(`${API}/register.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Échec inscription");
  return data;
}

export async function loginUser({ mail, password }) {
  const r = await fetch(`${API}/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mail, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Échec connexion");
  return data;
}
