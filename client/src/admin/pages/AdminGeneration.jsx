import React, { useState } from 'react';
import '../styles/AdminGeneration.css';

function AdminGeneration() {
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null); // 🚀 On ajoute un state pour gérer l'erreur
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [derniereGeneration, setDerniereGeneration] = useState({
    places: 0,
    echecs: 0,
    conflitsRestants: 0,
    executedAt: null,
  });

  function formatDerniereExecution(date) {
    if (!date) {
      return "Pas encore exécutée";
    }

    const now = new Date();
    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const heure = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const heureTexte = `${heure}h${minute}`;

    if (sameDay) {
      return `Aujourd'hui à ${heureTexte}`;
    }

    return `${date.toLocaleDateString('fr-FR')} à ${heureTexte}`;
  }

  const lancerAlgorithme = async () => {
    setLoading(true);
    setErreur(null);
    setResultat(null);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('http://localhost:5000/api/generation/generer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur serveur lors de la génération");
      }

      let conflitsRestants = 0;
      try {
        const conflitsRes = await fetch('http://localhost:5000/api/conflits/unresolved', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (conflitsRes.ok) {
          const conflitsData = await conflitsRes.json();
          conflitsRestants = Array.isArray(conflitsData)
            ? conflitsData.length
            : Array.isArray(conflitsData?.data)
            ? conflitsData.data.length
            : 0;
        }
      } catch (_e) {
        conflitsRestants = 0;
      }

      setResultat(data);
      setDerniereGeneration({
        places: Number(data?.stats?.places || 0),
        echecs: Number(data?.stats?.echecs || 0),
        conflitsRestants,
        executedAt: new Date(),
      });
    } catch (err) {
      console.error(err);
      setErreur(err.message); // 🚀 On stocke l'erreur pour l'afficher
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-generation-page">
      <div className="admin-generation-shell">
        <header className="admin-generation-header">
          <h1 className="admin-generation-title">Génération automatique</h1>
        </header>

        <section className="admin-generation-panel">
          <div className="admin-generation-actions">
            <button
              className="admin-generation-btn"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading}
            >
              {loading ? '🧠 Réflexion en cours...' : '⚡ Lancer la génération gloutonne'}
            </button>
          </div>

          <section className="admin-generation-last-run">
            <h2 className="admin-generation-last-run-title">Dernière génération</h2>
            <ul className="admin-generation-last-run-list">
              <li>{derniereGeneration.places} séances placées</li>
              <li>{derniereGeneration.conflitsRestants} conflit{derniereGeneration.conflitsRestants > 1 ? 's' : ''} détecté{derniereGeneration.conflitsRestants > 1 ? 's' : ''}</li>
            </ul>
            <p className="admin-generation-last-run-date">
              Dernière exécution : {formatDerniereExecution(derniereGeneration.executedAt)}
            </p>
          </section>

          {erreur ? (
            <div className="admin-generation-alert admin-generation-alert--error">
              <strong>Erreur :</strong> {erreur}
            </div>
          ) : null}

          {resultat && resultat.stats && (
            <div className="admin-generation-result">
              <h2 className="admin-generation-result-title">✅ Bilan de la génération</h2>

              <div className="admin-generation-stats">
                <div className="admin-generation-stat-card">
                  <span className="admin-generation-stat-label">Cours placés</span>
                  <strong className="admin-generation-stat-value">{resultat.stats.places}</strong>
                </div>

                <div className="admin-generation-stat-card admin-generation-stat-card--warning">
                  <span className="admin-generation-stat-label">Cours non placés</span>
                  <strong className="admin-generation-stat-value">{resultat.stats.echecs}</strong>
                </div>
              </div>

              {resultat.stats.echecs > 0 && (
                <div className="admin-generation-failures">
                  <h3 className="admin-generation-failures-title">
                    Liste des échecs (salles ou profs indisponibles)
                  </h3>
                  <ul className="admin-generation-failures-list">
                    {resultat.echecs.map((e, index) => (
                      <li key={index}>
                        {e.type_seance_souhaitee} (Prof: {e.enseignant_id}, Effectif demandé: {e.effectif})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="admin-generation-panel-note">
            Cet algorithme place automatiquement les demandes de cours en attente dans les premiers créneaux disponibles.
          </p>
        </section>

        {showConfirmModal ? (
          <div
            className="admin-generation-confirm-overlay"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="admin-generation-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-generation-confirm-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="admin-generation-confirm-title" className="admin-generation-confirm-title">
                Confirmer le lancement
              </h2>
              <p className="admin-generation-confirm-text">
                Voulez-vous lancer la génération automatique ?
              </p>

              <div className="admin-generation-confirm-actions">
                <button
                  type="button"
                  className="admin-generation-confirm-btn admin-generation-confirm-btn--ghost"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="admin-generation-confirm-btn admin-generation-confirm-btn--primary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setDerniereGeneration((current) => ({
                      ...current,
                      executedAt: new Date(),
                    }));
                    lancerAlgorithme();
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminGeneration;