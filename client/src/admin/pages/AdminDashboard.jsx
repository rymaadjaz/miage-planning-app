import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUsers, getSalles, getDashboardStats } from '../../services/api';
import "../styles/AdminDashboard.css";

const SALLE_TYPES_LABELS = {
  AMPHI: 'Amphithéâtre',
  TD: 'Salle TD',
  TP: 'Salle TP',
  LABO: 'Laboratoire',
  INFO: 'Salle informatique',
};

const SALLE_TYPES_COLORS = {
  AMPHI: '#8fb4dd',
  TD: '#6d95c6',
  TP: '#4f76a9',
  LABO: '#2f4f86',
  INFO: '#356ddb',
};

const ROLE_TEXT_COLORS = {
  administratif: '#295286',
  enseignant: '#246a4b',
  etudiant: '#5f46a3'
};

function groupSallesByType(salles) {
  const grouped = {};
  
  salles.forEach((salle) => {
    const type = (salle.type || 'AUTRE').toUpperCase();
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(salle);
  });

  return grouped;
}

function PieChart({ data }) {
  const total = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
  if (total === 0) return null;

  const segments = [];
  let currentAngle = 0;

  Object.entries(data).forEach(([type, salles]) => {
    const count = salles.length;
    const percentage = (count / total) * 100;
    const sliceAngle = (count / total) * 360;

    segments.push({
      type,
      count,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      color: SALLE_TYPES_COLORS[type] || '#cbd5e1',
    });

    currentAngle += sliceAngle;
  });

  const polarToCartesian = (angle, radius) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(radians),
      y: 100 + radius * Math.sin(radians),
    };
  };

  const getPath = (startAngle, endAngle, radius) => {
    const start = polarToCartesian(endAngle, radius);
    const end = polarToCartesian(startAngle, radius);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M 100 100`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="pie-chart-container">
      <svg viewBox="0 0 200 200" className="pie-chart">
        {segments.map((segment) => (
          <path
            key={segment.type}
            d={getPath(segment.startAngle, segment.endAngle, 80)}
            fill={segment.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="pie-legend">
        {segments.map((segment) => (
          <div key={segment.type} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: segment.color }}
            />
            <span className="legend-label">
              {SALLE_TYPES_LABELS[segment.type] || segment.type}
            </span>
            <span className="legend-count">
              {segment.count} ({segment.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRoleTextColor(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (ROLE_TEXT_COLORS[normalizedRole]) {
    return ROLE_TEXT_COLORS[normalizedRole];
  }

  let hash = 0;
  for (let index = 0; index < normalizedRole.length; index += 1) {
    hash = normalizedRole.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 45% 34%)`;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [salles, setSalles] = useState([]);
  const [sallesCount, setSallesCount] = useState(0);
  const [reservationsEnAttente, setReservationsEnAttente] = useState(0);
  const [conflitsNonResolus, setConflitsNonResolus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getToken();
        if (!token) {
          setError("Vous n'êtes pas connecté");
          setLoading(false);
          return;
        }

        const [usersResult, sallesResult, statsResult] = await Promise.all([
          getUsers(),
          getSalles(),
          getDashboardStats(),
        ]);

        setUsers(usersResult);
        setSalles(Array.isArray(sallesResult) ? sallesResult : []);
        setSallesCount(Array.isArray(sallesResult) ? sallesResult.length : 0);
        setReservationsEnAttente(statsResult?.reservationsEnAttente || 0);
        setConflitsNonResolus(statsResult?.conflitsNonResolus || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUsers(); 
  }, []);

  if (loading) return <div className="admin-page"><p>Chargement...</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p></div>;

  // Afficher seulement les 5 premiers utilisateurs pour l'aperçu
  const previewUsers = users.slice(0, 5);
  
  // Regrouper les salles par type
  const sallesByType = groupSallesByType(salles);

  return (
    <div className="admin-page">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Tableau de bord</h2>
        <div className="dashboard-actions" aria-label="Actions rapides">
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => navigate('/admin/salles')}
          >
            + une salle
          </button>
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => navigate('/admin/reservations')}
          >
            + une reservation
          </button>
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => navigate('/admin/generation')}
          >
            + generer edt
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-card dashboard-card-full">
          
          <div className="stats-cards-grid">
            <div className="stat-card stat-card-teal">
              <div className="stat-icon-container stat-icon-teal">
                <span className="stat-icon">👥</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{users.length}</p>
                <p className="stat-label">Utilisateurs</p>
              </div>
            </div>

            {/* Carte 2: Salles */}
            <div className="stat-card stat-card-blue-teal">
              <div className="stat-icon-container stat-icon-blue-teal">
                <span className="stat-icon">🏢</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{sallesCount}</p>
                <p className="stat-label">Nb salles</p>
              </div>
            </div>

            {/* Carte 3: Réservations en attente */}
            <div className="stat-card stat-card-orange">
              <div className="stat-icon-container stat-icon-orange">
                <span className="stat-icon">⏳</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{reservationsEnAttente}</p>
                <p className="stat-label">Réservations en attente</p>
              </div>
            </div>

            {/* Carte 4: Conflits non résolus */}
            <div className="stat-card stat-card-coral">
              <div className="stat-icon-container stat-icon-coral">
                <span className="stat-icon">⚠️</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{conflitsNonResolus}</p>
                <p className="stat-label">Conflits non résolus</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bloc 2: Aperçu utilisateurs */}
        <div className="dashboard-card dashboard-card-large">
          <h3>Aperçu des utilisateurs</h3>
          
          <div className="user-preview-list">
            {previewUsers.length > 0 ? (
              <>
                <div className="user-preview-header">
                  <div className="header-col header-nom">Nom</div>
                  <div className="header-col header-prenom">Prénom</div>
                  <div className="header-col header-email">Email</div>
                  <div className="header-col header-role">Rôle</div>
                </div>

                {previewUsers.map((user) => (
                  <div key={user.id} className="user-preview-row">
                    <div className="user-col user-nom">{user.nom}</div>
                    <div className="user-col user-prenom">{user.prenom}</div>
                    <div className="user-col user-email">{user.email}</div>
                    <div className="user-col user-role">
                      <span 
                        className={`role-badge role-${String(user.role || '').toLowerCase()}`}
                        style={{ color: getRoleTextColor(user.role) }}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>Aucun utilisateur disponible</p>
            )}
          </div>

          <button 
            className="btn-view-all"
            onClick={() => navigate('/admin/utilisateurs')}
          >
            Voir la liste complète
          </button>
        </div>

        {/* Bloc 3: Répartition des salles */}
        <div className="dashboard-card dashboard-card-small">
          <h3>Répartition des salles</h3>
          {Object.keys(sallesByType).length > 0 ? (
            <PieChart data={sallesByType} />
          ) : (
            <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
              Aucune donnée disponible
            </p>
          )}
        </div>
      </div>
    </div>
  );
}