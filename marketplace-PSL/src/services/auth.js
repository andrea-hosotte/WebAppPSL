// src/services/auth.js
import { api } from '../lib/apiClient';

export async function registerUser(payload) {
  // payload attendu par register.php (nom, prenom, mail, password, raison_soc, date_de_naissance?, etc.)
  return api.post('/register.php', payload);
}

export async function loginUser({ mail, password }) {
  return api.post('/login.php', { mail, password });
}