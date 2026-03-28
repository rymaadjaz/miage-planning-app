import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/Login.css";

function roleToPath(role) {
  if (role === "etudiant") return "/etudiant";
  if (role === "enseignant") return "/enseignant";
  if (role === "administratif") return "/admin";
  return "/login";
}

export default function Login() {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigateByRole = useCallback((role) => {
    navigate(roleToPath(role), { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez renseigner email et mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      const role = response?.user?.role;

      navigateByRole(role);
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div className="login-card">
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <button
            type="button"
            className="info-btn"
            aria-label="Informations"
            onClick={() => setShowInfo((prev) => !prev)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {showInfo && (
            <div className="info-popup">
              <div className="info-arrow" />
              <p className="info-popup-title">COMPTES DE DEMONSTRATION</p>
              <p className="info-role">Etudiant</p>
              <code className="info-email">edris.youssef@univ.fr</code>
              <p className="info-role">Enseignant</p>
              <code className="info-email">prof.beduneau@univ.fr</code>
              <p className="info-role">Admin</p>
              <code className="info-email">admin.planning@univ.fr</code>
              <hr className="info-divider" />
              <p className="info-note">Mot de passe pour les 3 comptes : changeme</p>
            </div>
          )}
        </div>

        <div className="login-logo">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1e2d4a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>

        <h1 className="login-title">Connexion</h1>
        <p className="login-subtitle">
          Plateforme de gestion des emplois du temps
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              Identifiant
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e2d4a"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="nom.prenom@univ.fr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label" htmlFor="password">
                Mot de passe
              </label>

              <button
                type="button"
                className="forgot-link"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e2d4a"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="************"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-password" aria-label="Afficher ou masquer le mot de passe">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#888"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {error && <p style={{ color: "#b42318", margin: "0 0 8px" }}>{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
