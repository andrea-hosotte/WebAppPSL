// src/components/AuthPanel.jsx 
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/auth";
import { useAuth } from "../context/AuthContext.jsx";
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

const card = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function AuthPanel() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

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
  const [state, setState] = useState({ loading: false, error: "" });

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validation e-mail simple
    if (!form.mail.includes("@")) {
      setState({ loading: false, error: "L’email doit contenir un @" });
      return;
    }

    // Validation âge si Particulier
    if (tab === "register" && form.raison_soc === "Particulier") {
      const dob = (form.date_de_naissance || "").trim();
      if (!dob || isNaN(Date.parse(dob))) {
        setState({ loading: false, error: "La date de naissance est obligatoire" });
        return;
      }
      // Force un parse stable en ISO (évite certains navigateurs capricieux)
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

    // Validation adresse minimale (on veut créer une ligne dans `adresse`)
    if (tab === "register") {
      if (!form.adresse_l1 || !form.code_postal || !form.ville) {
        setState({ loading: false, error: "Adresse incomplète (Ligne 1, Code postal, Ville requis)" });
        return;
      }
    }

    setState({ loading: true, error: "" });
    try {
      if (tab === "register") {
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
        const res = await registerUser(payload);
        setAuth({
          token: `u_${res.userId}`,
          user: { id: res.userId, mail: form.mail, nom: form.nom, prenom: form.prenom },
        });
      } else {
        const res = await loginUser({ mail: form.mail, password: form.password });
        setAuth({ token: res.token, user: res.user });
      }
      navigate("/home", { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setState({ loading: false, error: err.message || "Erreur" });
      return;
    }
    setState({ loading: false, error: "" });
  };

  return (
    <Paper
      component={motion.aside}
      variants={card}
      initial="initial"
      animate="animate"
      elevation={6}
      sx={{ borderRadius: 3, p: 2.5, bgcolor: "background.paper" }}
    >
      {/* Onglets */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="Se connecter" value="login" />
        <Tab label="S’inscrire" value="register" />
      </Tabs>

      <Box component="form" onSubmit={onSubmit} noValidate>
        {tab === "register" && (
          <Stack spacing={1.75} sx={{ mb: 1 }}>
            {/* Raison sociale */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Raison sociale</Typography>
              <RadioGroup row value={form.raison_soc} onChange={(e) => setForm((f) => ({ ...f, raison_soc: e.target.value }))}>
                <FormControlLabel value="Particulier" control={<Radio />} label="Particulier" />
                <FormControlLabel value="Professionnel" control={<Radio />} label="Professionnel" />
              </RadioGroup>
            </Box>

            {/* Identité */}
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
            {/* Date de naissance si Particulier */}
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

            <Divider sx={{ my: 0.5 }} />

            {/* Adresse (toujours demandée pour créer l'entrée dans la table `adresse`) */}
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

        {tab === "register" && (
          <>
            <Divider sx={{ my: 0.5, mb: 1, mt: 1 }} />
            <Typography variant="subtitle2">Identifiants</Typography>
          </>
        )}
        {/* Email / Mot de passe (visible pour Login et Register) */}
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

        {state.error && (
          <Alert severity="error" sx={{ mb: 1 }}>{state.error}</Alert>
        )}

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
