export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <h2>Tableau de bord Administrateur</h2>
      <p>Contenu placeholder pour le tableau de bord.</p>
      <div className="admin-dashboard-cards">
        <div className="admin-card">
          <h3>Statistiques générales</h3>
          <p>Nombre de salles, utilisateurs, réservations...</p>
        </div>
        <div className="admin-card">
          <h3>Actions rapides</h3>
          <p>Boutons pour génération auto, gestion conflits...</p>
        </div>
      </div>
    </div>
  );
}