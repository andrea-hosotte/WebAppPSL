/**
 * Service API — Produits (Front)
 *
 * Rôle
 * - Encapsule tous les appels HTTP vers l’API PHP `products.php`.
 * - Centralise la construction de l’URL (BASE) et la gestion des options `fetch`.
 *
 * Convention d’URL
 * - Liste / lecture :   GET    {BASE}/products.php?{queryString}
 * - Création :          POST   {BASE}/products.php
 * - Mise à jour :       PUT    {BASE}/products.php?id={id}
 * - Suppression :       DELETE {BASE}/products.php?id={id}
 *
 * Auth / session
 * - `credentials: "include"` est activé pour transporter les cookies (session PHP) si utilisés.
 * - Si votre API utilise un token Bearer, ajoutez l’en-tête Authorization ici (ou via apiClient).
 *
 * Erreurs
 * - Ce module lève une `Error("HTTP <status>")` si `res.ok === false`.
 * - Le parsing JSON est délégué au caller (retour de `res.json()`).
 */
// BASE : priorité à VITE_API_BASE_URL (ex: http://localhost/api). Fallback local si non défini.
const BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost/api";

/**
 * listProducts(params?)
 *
 * @param {Record<string, string|number|boolean>} [params] - Paramètres optionnels (filtres / pagination).
 *   Ils sont sérialisés via URLSearchParams.
 * @returns {Promise<any>} JSON renvoyé par l’API (souvent { ok, items } ou un tableau selon backend).
 *
 * Notes
 * - L’API doit répondre en JSON. L’appel fixe `Accept: application/json`.
 * - `credentials: include` permet le transport des cookies (session).
 */
export async function listProducts(params = {}) {
  // Sérialisation robuste des filtres/pagination (ex: { q: "clavier", limit: 20 })
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/products.php${qs ? `?${qs}` : ""}`;
  // GET /products.php : liste/lecture
  const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * createProduct(payload)
 *
 * @param {object} payload - Corps JSON du produit à créer.
 *   Le schéma dépend de la table `products` côté MySQL (ex: name, description, price_cents, stock, id_seller, ...).
 * @returns {Promise<any>} JSON de réponse (ex: { ok: true, id } ou { ok:false, error }).
 */
export async function createProduct(payload) {
  const url = `${BASE}/products.php`;
  // POST /products.php : création
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * updateProduct(id, payload)
 *
 * @param {string|number} id - Identifiant du produit (doit correspondre à la PK côté DB/API).
 * @param {object} payload - Champs à mettre à jour (patch complet ou partiel selon backend).
 * @returns {Promise<any>} JSON de réponse.
 *
 * @throws {Error} si `id` est falsy ou si la réponse HTTP n’est pas 2xx.
 */
export async function updateProduct(id, payload) {
  if (!id) throw new Error("updateProduct: id requis");
  const url = `${BASE}/products.php?id=${encodeURIComponent(id)}`;
  // PUT /products.php?id=... : mise à jour
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * deleteProduct(id)
 *
 * @param {string|number} id - Identifiant du produit à supprimer.
 * @returns {Promise<any>} JSON de réponse si présent, sinon `{ ok: true }`.
 *
 * Notes
 * - Certains backends renvoient un body vide en DELETE. Le try/catch gère ce cas.
 */
export async function deleteProduct(id) {
  if (!id) throw new Error("deleteProduct: id requis");
  const url = `${BASE}/products.php?id=${encodeURIComponent(id)}`;
  // DELETE /products.php?id=... : suppression
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // on renvoie le JSON si dispo, sinon un simple objet
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}