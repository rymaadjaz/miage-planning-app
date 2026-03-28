import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getSeanceDetailsForEnseignant } from '../../services/api';
import '../../styles/enseignant.css';

const TYPE_CLS = { CM: 'cm', TD: 'td', TP: 'tp', Examen: 'exam' };

const TYPE_LABELS = { CM: 'Cours Magistral', TD: 'Travaux Dirigés', TP: 'Travaux Pratiques', Examen: 'Examen' };

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function formatHour(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `${String(Number(value)).padStart(2, '0')}:00`;
}

function resolveSessionDate(seance) {
  if (seance.date) return seance.date;
  if (typeof seance.jour === 'number' && seance.jour >= 0 && seance.jour < DAY_NAMES.length) {
    return `Chaque ${DAY_NAMES[seance.jour]}`;
  }
  return 'Date non précisée';
}

export default function EnseignantSeanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seance, setSeance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSeance() {
      setLoading(true);
      try {
        const row = await getSeanceDetailsForEnseignant(id);
        if (isMounted) setSeance(row);
      } catch {
        if (isMounted) setSeance(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSeance();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="ens-page">
        <Navbar />
        <div className="ens-content" style={{ maxWidth: 520 }}>
          <div className="ens-card">Chargement des détails de la séance...</div>
        </div>
      </div>
    );
  }

  const notFound = (
    <div className="ens-page">
      <div className="ens-content" style={{ maxWidth: 480 }}>
        <div className="ens-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Séance introuvable</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            Cette séance n'existe pas ou a été supprimée.
          </p>
          <button className="ens-btn" onClick={() => navigate(-1)}>← Retour</button>
        </div>
      </div>
    </div>
  );

  if (!seance) return notFound;

  const typeCls = TYPE_CLS[seance.type] || 'cm';
  const typeLabel = TYPE_LABELS[seance.type] || seance.type;
  const title = seance.titre || seance.matiere || 'Séance';
  const sessionDate = resolveSessionDate(seance);
  const debut = seance.debut || formatHour(seance.heureDebut);
  const fin = seance.fin || formatHour(seance.heureFin);
  const cohorte = seance.cohorte || 'Non précisée';

  const equipements = seance.equipements ?? ['Vidéoprojecteur', 'Son', 'Wi-Fi'];

  return (
    <div className="ens-page">
      <Navbar />

      <div className="ens-content" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--muted)' }}
            onClick={() => navigate(-1)}
          >✕</button>
        </div>

        <div className="ens-card">
          <div className="ens-detail-header">
            <div className="ens-navbar-logo" style={{ background: 'var(--primary)', flexShrink: 0 }}>📅</div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 2 }}>{title}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Détails de la séance</p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className={`ens-detail-type-badge ${typeCls}`}>{typeLabel}</span>
          </div>

          <div className="ens-divider" />

          <div className="ens-detail-rows" style={{ marginTop: 16 }}>
            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">📅</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Date</div>
                <div className="row-value">{sessionDate}</div>
              </div>
            </div>

            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">⏰</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Horaire</div>
                <div className="row-value" style={{ fontFamily: 'DM Mono, monospace' }}>
                  {debut} – {fin}
                </div>
              </div>
            </div>

            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">📍</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Salle</div>
                <div className="row-value">{seance.salle}</div>
              </div>
            </div>

            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">🖥</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Équipements</div>
                <div className="ens-equipment-chips">
                  {equipements.map(eq => (
                    <span key={eq} className="ens-chip">
                      {eq === 'Vidéoprojecteur' ? '🖥' : eq === 'Son' ? '🔊' : '📶'} {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">👥</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Cohorte</div>
                <div className="row-value">{cohorte}</div>
              </div>
            </div>
          </div>

          {seance.description && (
            <>
              <div className="ens-divider" />
              <div>
                <div className="ens-section-title">Description</div>
                <p style={{ fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{seance.description}</p>
              </div>
            </>
          )}

          <div className="ens-divider" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="ens-btn-outline" onClick={() => navigate(-1)}>← Retour</button>
            <button className="ens-btn">✏ Modifier</button>
          </div>
        </div>
      </div>
    </div>
  );
}