import { useState } from "react";
import { motion } from "framer-motion";
import { loginUser, registerUser } from "../services/auth";
import { useAuth } from "../context/AuthContext.jsx";

const card = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function AuthPanel() {
  const { setAuth } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
  nom: "",
  prenom: "",
  adresse: "",
  tel: "",
  date_de_naissance: "",  
  mail: "",
  raison_soc: "Particulier",
  password: "",
});

  const [state, setState] = useState({ loading: false, error: "" });

  const onSubmit = async (e) => {
  e.preventDefault();

  // Vérification email
  if (!form.mail.includes("@")) {
    setState({ loading: false, error: "L’email doit contenir un @" });
    return;
  }

  // Vérification âge
  if (tab === "register") {
    if (!form.date_de_naissance) {
      setState({ loading: false, error: "La date de naissance est obligatoire" });
      return;
    }
    const birthDate = new Date(form.date_de_naissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      setState({ loading: false, error: "Vous devez avoir au moins 18 ans pour créer un compte" });
      return;
    }
  }

  // Si tout est bon → suite normale
  setState({ loading: true, error: "" });
  try {
    if (tab === "register") {
      const res = await registerUser(form);
      setAuth({
        token: `u_${res.userId}`,
        user: {
          id: res.userId,
          mail: form.mail,
          nom: form.nom,
          prenom: form.prenom,
        },
      });
    } else {
      const res = await loginUser({ mail: form.mail, password: form.password });
      setAuth({ token: res.token, user: res.user });
    }
  } catch (err) {
    setState({ loading: false, error: err.message || "Erreur" });
    return;
  }
  setState({ loading: false, error: "" });
};


  return (
    <motion.aside
      className="auth-card"
      variants={card}
      initial="initial"
      animate="animate"
      style={{
        background: "#fff",
        color: "#111",
        borderRadius: "16px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        padding: "24px",
        maxWidth: "380px",
        width: "100%",
        height: "fit-content",
        margin: "0 auto",
      }}
    >
      {/* Onglets */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          className={tab === "login" ? "active" : ""}
          onClick={() => setTab("login")}
          type="button"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "999px",
            border: "1px solid #ddd",
            background: tab === "login" ? "#4f46e5" : "#f9fafb",
            color: tab === "login" ? "#fff" : "#111",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Se connecter
        </button>
        <button
          className={tab === "register" ? "active" : ""}
          onClick={() => setTab("register")}
          type="button"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "999px",
            border: "1px solid #ddd",
            background: tab === "register" ? "#4f46e5" : "#f9fafb",
            color: tab === "register" ? "#fff" : "#111",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          S’inscrire
        </button>
      </div>

      {/* Formulaire */}
      <form className="auth-form" onSubmit={onSubmit} style={{ display: "grid", gap: "14px" }}>
        {tab === "register" && (
          <>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Nom</label>
              <input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Prénom</label>
              <input
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Adresse</label>
              <input
                value={form.adresse}
                onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Téléphone</label>
              <input
                value={form.tel}
                onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Date de naissance</label>
                <input
                type="date"
                value={form.date_de_naissance}
                onChange={(e) => setForm((f) => ({ ...f, date_de_naissance: e.target.value }))}
                required
                style={inputStyle}
                />
          </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Raison Sociale</label>
              <select
                value={form.raison_soc}
                onChange={(e) => setForm((f) => ({ ...f, raison_soc: e.target.value }))}
                style={inputStyle}
              >
                <option value="Particulier">Particulier</option>
                <option value="Professionel">Professionel</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={form.mail}
            onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Mot de passe</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
            style={inputStyle}
          />
        </div>

        {state.error && (
          <div style={{ color: "crimson", fontSize: 13, marginTop: "-6px" }}>
            {state.error}
          </div>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={state.loading}
          style={{
            marginTop: "6px",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            cursor: "pointer",
            transition: "opacity .2s",
          }}
        >
          {state.loading ? "..." : tab === "login" ? "Connexion" : "Créer le compte"}
        </button>
      </form>
    </motion.aside>
  );
}

// Style commun aux inputs
const inputStyle = {
  width: "100%",
  marginTop: "4px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box",
};
