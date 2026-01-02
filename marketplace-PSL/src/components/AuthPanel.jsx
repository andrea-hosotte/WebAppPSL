/**
 * @file AuthPanel.jsx
 * @description
 * Panneau d’authentification (connexion / inscription) basé sur MUI.
 *
 * Responsabilités
 * - Affiche 2 modes via onglets :
 *   - Login : vérifie email + mot de passe via `loginUser()`.
 *   - Register : crée une adresse (table `adresse`) + un utilisateur (table `users`) via `registerUser()`.
 * - Applique des validations front minimales (email, âge >= 18 pour Particulier, champs requis).
 * - Met à jour le contexte d’auth (`AuthContext`) via `setAuth()`.
 * - Redirige vers `/home` après succès + scroll top.
 *
 * Dépendances clés
 * - `services/auth` : couche réseau vers `login.php` / `register.php`.
 * - `AuthContext` : stockage du token + user côté front.
 * - `@mui/x-date-pickers` + dayjs : sélection et normalisation de la date de naissance.
 *
 * Notes sécurité
 * - Les validations front améliorent l’UX, mais la validation forte doit rester côté API/DB.
 * - Ne jamais faire confiance au front pour l’âge, l’unicité du mail ou la conformité du mot de passe.
 */
// src/components/AuthPanel.jsx 
// React : état local du formulaire
import { useState } from "react";
// Animations : transitions légères du panneau
import { motion } from "framer-motion";
// Routing : redirection post-auth
import { useNavigate } from "react-router-dom";
// Services : appels API d'authentification (login / register)
import { loginUser, registerUser } from "../services/auth";
// Contexte Auth : persistance token + user (utilisé pour protéger les routes)
import { useAuth } from "../context/AuthContext.jsx";
// UI : Material UI (layout + champs + feedback)
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Stack,
  TextField,
  Button,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
// DatePicker : MUI X + dayjs (format ISO YYYY-MM-DD)
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

/**
 * Variants Framer Motion : animation d'apparition du panneau.
 */
const card = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * AuthPanel
 *
 * Flux de données
 * - Login : `loginUser({ mail, password })` → `{ token, user }`.
 * - Register : `registerUser(payload)` → `{ userId }` (selon votre API) puis setAuth.
 *
 * Convention utilisateur
 * - `raison_soc` détermine le type de compte :
 *   - Particulier : prénom + date de naissance requis, contrôle âge >= 18.
 *   - Professionnel : prénom ignoré, date de naissance null.
 */
export function AuthPanel() {
  // setAuth : met à jour le contexte global (token + user) utilisé par RequireAuth / Navbar.
  const { setAuth } = useAuth();
  // navigate : redirection vers la page d'accueil applicative après authentification.
  const navigate = useNavigate();

  // State `form` : modèle unique pour login + register.
  // - En mode login : seuls `mail` et `password` sont réellement utilisés.
  // - En mode register : identité + adresse + éventuelle date de naissance.
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    // Identité
    nom: "",
    prenom: "",
    mail: "",
    password: "",
    tel: "",
    raison_soc: "Particulier", // Particulier | Professionnel
    date_de_naissance: "",
    // Adresse (sera insérée dans table `adresse` puis reliée via Id_adresse)
    adresse_l1: "",
    code_postal: "",
    ville: "",
    pays: "France",
  });
  // State UX : `loading` (désactive le submit) + `error` (feedback utilisateur).
  const [state, setState] = useState({ loading: false, error: "" });

  const onSubmit = async (e) => {
    // Empêche le rechargement de page (soumission contrôlée côté React).
    e.preventDefault();

    // Validation front minimale : l'input type=email valide déjà, mais on renforce avec un test simple.
    if (!form.mail.includes("@")) {
      setState({ loading: false, error: "L’email doit contenir un @" });
      return;
    }

    // Règle métier : un Particulier doit fournir une date valide et être majeur (>= 18 ans).
    if (tab === "register" && form.raison_soc === "Particulier") {
      // `date_de_naissance` est stockée sous forme ISO (YYYY-MM-DD) pour être compatible API/DB.
      const dob = (form.date_de_naissance || "").trim();
      if (!dob || isNaN(Date.parse(dob))) {
        setState({ loading: false, error: "La date de naissance est obligatoire" });
        return;
      }
      // Construction de date "stable" : évite les divergences de parsing (timezone / formats locaux).
      const birthDate = new Date(dob + "T00:00:00");
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18) {
        setState({ loading: false, error: "Vous devez avoir au moins 18 ans pour créer un compte" });
        return;
      }
    }

    // Règle technique : l'API register crée une ligne dans la table `adresse` → champs minimaux requis.
    if (tab === "register") {
      if (!form.adresse_l1 || !form.code_postal || !form.ville) {
        setState({ loading: false, error: "Adresse incomplète (Ligne 1, Code postal, Ville requis)" });
        return;
      }
    }

    // Reset erreurs + activation du loading avant appel réseau.
    setState({ loading: true, error: "" });
    try {
      if (tab === "register") {
        // Payload envoyé à `register.php`.
        // IMPORTANT : l'adresse est un objet (et non une string) pour permettre :
        // 1) insertion dans `adresse`
        // 2) insertion dans `users` avec `Id_adresse` (FK)
        const payload = {
          nom: form.nom,
          prenom: form.raison_soc === "Particulier" ? form.prenom : "",
          mail: form.mail,
          password: form.password,
          tel: form.tel,
          raison_soc: form.raison_soc,
          date_de_naissance: form.raison_soc === "Particulier" ? form.date_de_naissance : null,
          // 👇 Objet adresse envoyé à register.php pour créer l'entrée `adresse`
          adresse: {
            ligne: form.adresse_l1,
            code_postal: form.code_postal,
            ville: form.ville,
            pays: form.pays || "France",
          },
        };
        // Appel API register : doit renvoyer un identifiant utilisateur (ex: userId).
        const res = await registerUser(payload);
        // Mise à jour du contexte : on crée un token front "mock" si l'API n'émet pas de JWT.
        // Si votre API renvoie un vrai token, privilégier celui du backend.
        setAuth({
          token: `u_${res.userId}`,
          user: { id: res.userId, mail: form.mail, nom: form.nom, prenom: form.prenom, raison_soc: form.raison_soc },
        });
      } else {
        // Login : l'API renvoie typiquement `{ token, user }`.
        const res = await loginUser({ mail: form.mail, password: form.password });
        setAuth({ token: res.token, user: res.user });
      }
      // Navigation post-auth : envoie l'utilisateur sur la Home (route applicative).
      navigate("/home", { replace: true });
      // UX : force le scroll en haut après navigation.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Gestion d'erreur : message issu du service (HTTP / JSON `{ok:false}`) ou fallback générique.
      setState({ loading: false, error: err.message || "Erreur" });
      return;
    }
    setState({ loading: false, error: "" });
  };

  return (
    // Conteneur : carte MUI animée (Framer Motion)
    <Paper
      component={motion.aside}
      variants={card}
      initial="initial"
      animate="animate"
      elevation={6}
      sx={{ borderRadius: 3, p: 2.5, bgcolor: "background.paper" }}
    >
      {/* Navigation interne : bascule Login / Register */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="Se connecter" value="login" />
        <Tab label="S’inscrire" value="register" />
      </Tabs>

      <Box component="form" onSubmit={onSubmit} noValidate>
        {/* Bloc Inscription : identité + adresse + date de naissance conditionnelle */}
        {tab === "register" && (
          <Stack spacing={1.75} sx={{ mb: 1 }}>
            {/* Raison sociale : conditionne les champs affichés (prénom, date de naissance) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Raison sociale</Typography>
              <RadioGroup row value={form.raison_soc} onChange={(e) => setForm((f) => ({ ...f, raison_soc: e.target.value }))}>
                <FormControlLabel value="Particulier" control={<Radio />} label="Particulier" />
                <FormControlLabel value="Professionnel" control={<Radio />} label="Professionnel" />
              </RadioGroup>
            </Box>

            {/* Identité : nom (ou nom d'entreprise) + prénom (Particulier uniquement) + téléphone */}
            <TextField
              label={form.raison_soc === "Particulier" ? "Nom" : "Nom de l’entreprise"}
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              required
              fullWidth
            />

            {form.raison_soc === "Particulier" && (
              <TextField
                label="Prénom"
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                required
                fullWidth
              />
            )}

            <TextField
              label="Téléphone"
              type="tel"
              value={form.tel}
              onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
              inputProps={{ maxLength: 20, inputMode: "tel", pattern: "[0-9+ ]{6,20}" }}
              fullWidth
            />  
            {/* Date de naissance : affichée uniquement pour Particulier (format ISO) */}
            {form.raison_soc === "Particulier" && (
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                <DatePicker
                  label="Date de naissance"
                  value={form.date_de_naissance ? dayjs(form.date_de_naissance) : null}
                  onChange={(val) => {
                    const iso = val && val.isValid() ? val.format('YYYY-MM-DD') : '';
                    setForm((f) => ({ ...f, date_de_naissance: iso }));
                  }}
                  maxDate={dayjs()}
                  disableFuture
                  openTo="year"
                  views={["year", "month", "day"]}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
              </LocalizationProvider>
            )}

            {/* Adresse : nécessaire pour créer la ligne dans la table `adresse` */}
            <Divider sx={{ my: 0.5 }} />

            <Typography variant="subtitle2">Adresse</Typography>
            <TextField
              label="Ligne 1"
              value={form.adresse_l1}
              onChange={(e) => setForm((f) => ({ ...f, adresse_l1: e.target.value }))}
              required
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Code postal"
                value={form.code_postal}
                onChange={(e) => setForm((f) => ({ ...f, code_postal: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Ville"
                value={form.ville}
                onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Pays"
              value={form.pays}
              onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))}
              fullWidth
            />
          </Stack>
        )}

        {/* Compartiment Identifiants : visible uniquement en inscription (mais champs partagés login/register) */}
        {tab === "register" && (
          <>
            <Divider sx={{ my: 0.5, mb: 1, mt: 1 }} />
            <Typography variant="subtitle2">Identifiants</Typography>
          </>
        )}
        {/* Email / Mot de passe : utilisés pour Login et Register */}
        <Stack spacing={1.75} sx={{ mb: 1,mt: 1.5 }}>
          <TextField
            label="Email"
            type="email"
            value={form.mail}
            onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            fullWidth
            inputProps={{ minLength: 6 }}
          />
        </Stack>

        {/* Feedback : erreur (validation front ou réponse API) */}
        {state.error && (
          <Alert severity="error" sx={{ mb: 1 }}>{state.error}</Alert>
        )}

        {/* Soumission : déclenche `onSubmit` (loading + CircularProgress) */}
        <Box sx={{ position: 'relative' }}>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={state.loading} sx={{ py: 1.2, fontWeight: 700, borderRadius: 2 }}>
            {tab === "login" ? "Connexion" : "Créer le compte"}
          </Button>
          {state.loading && (
            <CircularProgress size={22} sx={{ position: 'absolute', top: '50%', right: 12, mt: '-11px' }} />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
