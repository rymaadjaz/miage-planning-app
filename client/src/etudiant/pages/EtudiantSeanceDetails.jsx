import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getSeanceDetailsForEtudiant } from '../../services/api';
import '../../styles/enseignant.css';
import '../../styles/etudiant.css';

const TYPE_CLS = {
  CM: 'cm',
  TD: 'td',
  TP: 'tp',
  EXAM: 'exam',
};

const TYPE_LABELS = {
  CM: 'Cours Magistral',
  TD: 'Travaux Diriges',
  TP: 'Travaux Pratiques',
  EXAM: 'Examen',
};

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
  return 'Date non precisee';
}

function resolveCohorte(seance) {
  if (seance.cohorte) return seance.cohorte;
  return 'L3 Informatique';
}

export default function EtudiantSeanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seance, setSeance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSeance() {
      setLoading(true);
      try {
        const row = await getSeanceDetailsForEtudiant(id);
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
        <Navbar onNotifications={() => navigate('/etudiant/notifications')} />
        <div className="ens-content etu-detail-content">
          <div className="ens-card">Chargement des détails de la séance...</div>
        </div>
      </div>
    );
  }

  if (!seance) {
    return (
      <div className="ens-page">
        <Navbar onNotifications={() => navigate('/etudiant/notifications')} />
        <div className="ens-content etu-detail-notfound-content">
          <div className="ens-card etu-detail-notfound-card">
            <div className="etu-detail-notfound-icon">🔍</div>
            <h3 className="etu-detail-notfound-title">Seance introuvable</h3>
            <p className="etu-detail-notfound-text">
              Cette seance n'existe pas ou n'est plus disponible.
            </p>
            <button className="ens-btn" onClick={() => navigate('/etudiant')}>
              Retour au calendrier
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeCls = TYPE_CLS[seance.type] || 'cm';
  const typeLabel = TYPE_LABELS[seance.type] || seance.type;
  const title = seance.titre || seance.matiere || 'Seance';
  const sessionDate = resolveSessionDate(seance);
  const debut = seance.debut || formatHour(seance.heureDebut);
  const fin = seance.fin || formatHour(seance.heureFin);

  return (
    <div className="ens-page">
      <Navbar onNotifications={() => navigate('/etudiant/notifications')} />

      <div className="ens-content etu-detail-content">
        <div className="etu-detail-close-row">
          <button
            className="etu-detail-close-btn"
            onClick={() => navigate('/etudiant')}
          >
            ✕
          </button>
        </div>

        <div className="ens-card">
          <div className="ens-detail-header">
            <div className="ens-navbar-logo etu-detail-title-icon">📅</div>
            <div>
              <h2 className="etu-detail-title">{title}</h2>
              <p className="etu-detail-subtitle">Details de la seance</p>
            </div>
          </div>

          <div className="etu-detail-badge-wrap">
            <span className={`ens-detail-type-badge ${typeCls}`}>{typeLabel}</span>
          </div>

          <div className="etu-divider" />

          <div className="ens-detail-rows etu-detail-rows-top">
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
                <div className="row-value etu-detail-time">
                  {debut} - {fin}
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
              <div className="ens-detail-row-icon">👨‍🏫</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Enseignant</div>
                <div className="row-value">{seance.enseignant || 'Non precise'}</div>
              </div>
            </div>

            <div className="ens-detail-row">
              <div className="ens-detail-row-icon">👥</div>
              <div className="ens-detail-row-content">
                <div className="row-label">Cohorte</div>
                <div className="row-value">{resolveCohorte(seance)}</div>
              </div>
            </div>
          </div>

          <div className="etu-divider" />
          <div className="etu-detail-footer">
            <button className="ens-btn-outline" onClick={() => navigate('/etudiant')}>
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
