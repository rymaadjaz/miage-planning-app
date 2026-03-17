import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  if (!user) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bienvenue, {user.prenom} {user.nom} !</h1>
      <p><strong>Votre rôle :</strong> {user.role}</p>
      
      {user.role === 'administratif' && <button>Gérer les Salles</button>}
      {user.role === 'etudiant' && <button>Voir mon Emploi du Temps</button>}
      {user.role === 'enseignant' && <button>Demande</button>}

      <button onClick={() => { localStorage.clear(); navigate('/login'); }}>
        Se déconnecter
      </button>
    </div>
  );
};

export default Dashboard;