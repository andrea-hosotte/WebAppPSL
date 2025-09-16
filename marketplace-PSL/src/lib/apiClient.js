// src/lib/apiClient.js

// Délai maximum par défaut pour une requête (en millisecondes).
// Passé ce délai, on annule la requête via AbortController pour éviter les fetch pendants.
const DEFAULT_TIMEOUT = 15000;

/**
 * Construit l'URL de base de l'API.
 * - Priorité 1 : variable d'env Vite `VITE_API_BASE_URL` (définie dans .env).
 *   Exemple: VITE_API_BASE_URL=http://localhost/api
 * - Priorité 2 : fallback '/api' (utile en dev si tu utilises le proxy Vite).
 * On retire les slash finaux pour éviter les doublons de type http://.../api//products
 */
function buildBaseUrl() {
  // `import.meta.env` est fourni par Vite au build/serve.
  const fromEnv = import.meta?.env?.VITE_API_BASE_URL;
  // Si non défini, on retombe sur '/api' (chemin relatif vers le proxy Vite).
  return (fromEnv || '/api').replace(/\/+$/, '');
}

/**
 * Fabrique un AbortController avec un timeout.
 * - Retourne { signal, clear } :
 *   - `signal` : à passer à fetch() pour permettre l'annulation.
 *   - `clear()` : à appeler quand la requête se termine pour nettoyer le timer.
 */
function withTimeout(ms) {
  const controller = new AbortController();              // Crée un contrôleur d'annulation.
  const t = setTimeout(() => controller.abort(), ms);    // Programme l'annulation au bout de `ms`.
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

/**
 * Appel HTTP générique.
 *
 * @param {string} path - Chemin relatif ('/products')
 * @param {object} options - Options de la requête.
 *   - method   : 'GET' (par défaut), 'POST', 'PUT', 'PATCH', 'DELETE'
 *   - headers  : en-têtes additionnels (sera converti en Headers)
 *   - body     : objet JS (sera JSON.stringify) ou FormData (envoyée telle quelle)
 *   - token    : string JWT/Bearer; injecté en Authorization si présent
 *   - timeout  : durée max avant abort (ms); défaut = DEFAULT_TIMEOUT
 *
 * @returns {Promise<any>} - Données parsées (JSON si possible, sinon texte brut).
 * @throws Error enrichie de `status` et `data` si status HTTP non-OK.
 */
export async function apiFetch(
  path,
  { method = 'GET', headers = {}, body, token, timeout = DEFAULT_TIMEOUT } = {}
) {
  // 1) Concatène base + path (en gérant '/')
  const base = buildBaseUrl();
  const url = path.startsWith('http')      // Si path est déjà une URL complète, on la garde.
    ? path
    : `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  // 2) Met en place le timeout (AbortController)
  const { signal, clear } = withTimeout(timeout);

  // 3) Normalise les en-têtes
  const h = new Headers(headers);

  // Si on n'envoie PAS un formulaire (FormData), alors on force JSON.
  // (Si c'est FormData, fetch mettra le Content-Type (multipart/form-data; boundary=...) tout seul.)
  if (!(body instanceof FormData)) h.set('Content-Type', 'application/json');

  // Si un token est fourni, on l'ajoute en Authorization: Bearer <token>
  if (token) h.set('Authorization', `Bearer ${token}`);

  try {
    // Log debug utile pour visualiser l'URL finale dans la console du navigateur.
    console.debug('[API] →', url);

    // 4) Appel réseau
    const res = await fetch(url, {
      method,
      headers: h,
      body: body
        ? (body instanceof FormData ? body : JSON.stringify(body)) // JSON.stringify seulement si pas FormData
        : undefined,
      credentials: 'include', // inclut cookies (utile si l'API utilise une session)
      signal,                 // relie le signal d'annulation au fetch
    });

    // 5) Lecture de la réponse en texte (pour ensuite tenter un parse JSON)
    // On lit d'abord en texte pour pouvoir renvoyer la chaîne brute si ce n'est pas du JSON.
    const text = await res.text();
    let data = null;
    try {
      // Si le corps n'est pas vide, on essaie de parser en JSON
      data = text ? JSON.parse(text) : null;
    } catch {
      // Si le parse JSON échoue (réponse non JSON), on garde le texte brut.
      data = text;
    }

    // 6) Gestion des statuts HTTP d'erreur
    if (!res.ok) {
      // On fabrique un message d'erreur parlant :
      // - Priorité au champ `message` ou `error` du JSON si l'API l'a fourni,
      // - sinon statusText, sinon message générique.
      const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
      const err = new Error(msg);
      // On annote l'Error avec des infos utiles au débogage:
      err.status = res.status; // ex: 400/401/403/404/500
      err.data = data;         // payload d'erreur renvoyé par l'API (utile pour afficher des détails)
      throw err;               // Remonte l'erreur au composant appelant.
    }

    // 7) Si tout va bien, on renvoie les données (JSON si parse OK, sinon texte)
    return data;
  } finally {
    // 8) Nettoyage : on enlève le timer du timeout pour éviter les fuites.
    clear();
  }
}

export const api = {
  get:  (p, o)      => apiFetch(p, { ...o, method: 'GET' }),
  post: (p, b, o)   => apiFetch(p, { ...o, method: 'POST', body: b }),
  put:  (p, b, o)   => apiFetch(p, { ...o, method: 'PUT', body: b }),
  patch:(p, b, o)   => apiFetch(p, { ...o, method: 'PATCH', body: b }),
  del:  (p, o)      => apiFetch(p, { ...o, method: 'DELETE' }),
};
