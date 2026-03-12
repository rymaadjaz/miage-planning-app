import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bienvenue sur le Planning MIAGE</h1>
      <p>Gérez vos cours simplement.</p>
      
      <div>
        <Link to="/login">
          <button>Se Connecter</button>
        </Link>
        <Link to="/dashboard">
          <button >Voir le Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;