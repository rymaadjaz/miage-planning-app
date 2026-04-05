import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 AJOUTÉ
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate(); // 👈 AJOUTÉ
  const [users, setUsers] = useState([]);
  const [sallesCount, setSallesCount] = useState(0); // 👈 AJOUTÉ
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => { // On renomme pour charger plusieurs choses
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!token) {
          setError("Vous n'êtes pas connecté");
          setLoading(false);
          return;
        }

        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 1. Récupérer les utilisateurs
        const resUsers = await fetch('http://localhost:5000/api/users', { headers });
        const usersData = await resUsers.json();
        if (resUsers.ok) setUsers(usersData);

        // 2. Récupérer le nombre de salles (Optionnel, selon ton API)
        const resSalles = await fetch('http://localhost:5000/api/salles', { headers });
        const sallesData = await resSalles.json();
        if (resSalles.ok) setSallesCount(sallesData.length);

        setLoading(false);
      } catch (err) {
        console.error("Erreur :", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData(); 
  }, []);

  if (loading) return <p>Chargement du tableau de bord...</p>;
  if (error) return <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>;

  return (
    <div className="admin-page">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Tableau de bord Administrateur</h2>
        <div className="dashboard-actions">
          <button className="dashboard-action-btn" onClick={() => navigate('/admin/salles')}>
            + une salle
          </button>
          <button className="dashboard-action-btn" onClick={() => navigate('/admin/reservations')}>
            + une reservation
          </button>
          <button className="dashboard-action-btn" onClick={() => navigate('/admin/generation')}>
            + generer edt
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-card dashboard-card-full">
          <h3>Aperçu général</h3>
          <div className="stats-cards-grid">
            {/* Carte Utilisateurs */}
            <div className="stat-card stat-card-teal">
              <div className="stat-icon-container stat-icon-teal">
                <span className="stat-icon">👥</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{users.length}</p>
                <p className="stat-label">Utilisateurs</p>
              </div>
            </div>

            {/* Carte Salles */}
            <div className="stat-card stat-card-blue-teal">
              <div className="stat-icon-container stat-icon-blue-teal">
                <span className="stat-icon">🏢</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">{sallesCount}</p>
                <p className="stat-label">Nb salles</p>
              </div>
            </div>

            {/* Carte Réservations (Statique ou à fetcher) */}
            <div className="stat-card stat-card-orange">
              <div className="stat-icon-container stat-icon-orange">
                <span className="stat-icon">⏳</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">12</p> 
                <p className="stat-label">Réservations en attente</p>
              </div>
            </div>

            {/* Carte Conflits (Statique ou à fetcher) */}
            <div className="stat-card stat-card-coral">
              <div className="stat-icon-container stat-icon-coral">
                <span className="stat-icon">⚠️</span>
              </div>
              <div className="stat-content">
                <p className="stat-number">5</p>
                <p className="stat-label">Conflits non résolus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-users-list" style={{ marginTop: '20px' }}>
        <h3>Liste des Utilisateurs</h3>
        <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{user.nom}</td>
                <td>{user.prenom}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}