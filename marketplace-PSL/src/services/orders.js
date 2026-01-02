/**
 * @file src/services/orders.js
 * @description
 * Service front-end responsable de la création des commandes (checkout).
 *
 * Ce module encapsule l’appel HTTP vers l’API PHP `order.php` et définit
 * le contrat exact attendu entre le front React et le back-end.
 *
 * Responsabilités :
 * - Construire le payload conforme au schéma attendu par l’API
 * - Gérer la communication HTTP (fetch)
 * - Normaliser les erreurs côté front
 *
 * Dépendances :
 * - Variable d’environnement Vite : VITE_API_BASE_URL
 * - API PHP : POST /order.php
 */

/**
 * URL de base de l’API.
 *
 * - Priorité à la variable d’environnement VITE_API_BASE_URL
 * - Suppression des slashs finaux pour éviter les doublons
 * - Fallback vers l’API locale XAMPP
 */
const BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost/api";

/**
 * Crée une nouvelle commande côté serveur.
 *
 * @async
 * @function createOrder
 *
 * @param {Object} params
 * @param {number} params.userId - Identifiant de l’utilisateur connecté (FK users.id)
 * @param {Array<Object>} params.lines - Lignes de commande (produits)
 * @param {number} params.total - Montant total de la commande (en centimes ou euros selon convention back)
 *
 * @returns {Promise<Object>} Réponse JSON de l’API (commande créée)
 *
 * @throws {Error}
 * - Si la requête HTTP échoue
 * - Si l’API retourne { ok: false }
 *
 * @example
 * await createOrder({
 *   userId: 3,
 *   total: 22140,
 *   lines: [
 *     { id: 1, qty: 2, price: 650 },
 *     { id: 2, qty: 1, price: 16500 }
 *   ]
 * });
 */
export async function createOrder({ userId, lines, total }) {
  /**
   * Appel HTTP vers l’API de création de commande.
   *
   * - Méthode POST
   * - credentials: "include" pour transmettre les cookies de session PHP
   * - Content-Type JSON
   */
  const res = await fetch(`${BASE}/order.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      /**
       * Identifiant utilisateur (doit correspondre à users.id côté DB)
       */
      user_id: userId,

      /**
       * Normalisation des lignes de commande :
       * - id : identifiant du produit (robuste selon la structure du panier)
       * - qty : quantité (forcée en Number)
       * - price : prix unitaire (forcé en Number)
       */
      lines: lines.map((l) => ({
        id: l.id ?? l.product_id ?? l.name,
        qty: Number(l.qty || 1),
        price: Number(l.price || 0),
      })),

      /**
       * Total calculé côté front (validation finale côté back recommandée)
       */
      total,
    }),
  });

  /**
   * Tentative de parsing JSON de la réponse.
   * En cas de réponse vide ou invalide, on retourne un objet vide.
   */
  const data = await res.json().catch(() => ({}));

  /**
   * Gestion des erreurs :
   * - HTTP non-OK
   * - Réponse API explicite { ok: false }
   */
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  /**
   * Réponse valide de l’API :
   * - Contient généralement l’id de la commande créée
   * - Peut contenir des métadonnées supplémentaires (selon implémentation PHP)
   */
  return data;
}