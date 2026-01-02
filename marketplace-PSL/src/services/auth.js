/**
 * @file src/services/auth.js
 * @description
 * Service d’authentification front-end.
 *
 * Ce module centralise tous les appels HTTP liés à l’authentification
 * utilisateur (inscription, connexion).
 *
 * Il agit comme une couche d’abstraction entre :
 * - les composants React (AuthPanel, Auth, RequireAuth, etc.)
 * - l’API PHP (register.php, login.php)
 *
 * Objectifs :
 * - Garantir un contrat clair entre le front et le back
 * - Simplifier la maintenance et l’évolution de l’authentification
 * - Éviter la duplication de logique réseau dans les composants
 */

import { api } from "../lib/apiClient";

/**
 * Inscription d’un nouvel utilisateur.
 *
 * Cette fonction envoie l’intégralité du payload d’inscription
 * vers l’API PHP `register.php`.
 *
 * Le payload est volontairement non transformé ici :
 * - La validation métier (âge, raison sociale, champs requis)
 *   est assurée côté back
 * - Le front se contente de transmettre les données collectées
 *
 * @async
 * @function registerUser
 *
 * @param {Object} payload - Données d’inscription
 * @param {string} payload.nom - Nom (ou nom de l’entreprise)
 * @param {string} payload.prenom - Prénom (Particulier uniquement)
 * @param {string} payload.mail - Email de connexion (unique)
 * @param {string} payload.password - Mot de passe en clair (hashé côté back)
 * @param {string} payload.raison_soc - "Particulier" | "Professionnel"
 * @param {string|null} payload.date_de_naissance - Obligatoire si Particulier
 * @param {Object} payload.adresse - Objet adresse imbriqué
 *
 * @returns {Promise<Object>} Réponse JSON de l’API
 *
 * @throws {Error}
 * - Si la requête HTTP échoue
 * - Si l’API retourne une erreur métier
 *
 * @example
 * await registerUser({
 *   nom: "Dupont",
 *   prenom: "Jean",
 *   mail: "jean.dupont@test.fr",
 *   password: "secret123",
 *   raison_soc: "Particulier",
 *   date_de_naissance: "1990-05-12",
 *   adresse: {
 *     ligne: "12 rue de Paris",
 *     code_postal: "75001",
 *     ville: "Paris",
 *     pays: "France"
 *   }
 * });
 */
export async function registerUser(payload) {
  /**
   * Appel POST vers l’API PHP.
   *
   * - L’URL est résolue par apiClient (BASE_URL + endpoint)
   * - credentials: "include" est géré par apiClient
   */
  return api.post("/register.php", payload);
}

/**
 * Connexion d’un utilisateur existant.
 *
 * Cette fonction envoie uniquement les identifiants nécessaires
 * à l’authentification (email + mot de passe).
 *
 * En cas de succès :
 * - L’API retourne les informations utilisateur
 * - Le token / état de session est géré côté back (PHP session ou cookie)
 *
 * @async
 * @function loginUser
 *
 * @param {Object} params
 * @param {string} params.mail - Email utilisateur
 * @param {string} params.password - Mot de passe en clair
 *
 * @returns {Promise<Object>} Données utilisateur authentifié
 *
 * @throws {Error}
 * - Si les identifiants sont invalides
 * - Si l’API retourne une erreur HTTP
 *
 * @example
 * const user = await loginUser({
 *   mail: "jean.dupont@test.fr",
 *   password: "secret123"
 * });
 */
export async function loginUser({ mail, password }) {
  /**
   * Appel POST vers l’API PHP de connexion.
   *
   * Le back :
   * - Vérifie les identifiants
   * - Initialise la session
   * - Retourne le profil utilisateur (id, nom, raison_soc, etc.)
   */
  return api.post("/login.php", { mail, password });
}