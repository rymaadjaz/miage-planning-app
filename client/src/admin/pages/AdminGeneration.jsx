import React, { useState } from 'react';

function AdminGeneration() {
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null); // 🚀 On ajoute un state pour gérer l'erreur

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

      setResultat(data);
    } catch (err) {
      console.error(err);
      setErreur(err.message); // 🚀 On stocke l'erreur pour l'afficher
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-generation" style={{ padding: '20px' }}>
      <h2>Génération Automatique (Algorithme Glouton)</h2>
      <p>Cet algorithme place automatiquement les demandes de cours en attente dans les premiers créneaux disponibles.</p>
      
      <button 
        className="btn-primary" 
        onClick={lancerAlgorithme} 
        disabled={loading}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? '🧠 Réflexion en cours...' : '⚡ Lancer la Génération Gloutonne'}
      </button>

      {resultat && resultat.stats && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#e8f5e9' }}>
          <h3>✅ Bilan de la génération</h3>
          <p>Cours placés avec succès : <strong>{resultat.stats.places}</strong></p>
          <p>Cours impossibles à placer : <strong>{resultat.stats.echecs}</strong></p>
          
          {resultat.stats.echecs > 0 && (
            <div style={{ color: '#d32f2f', marginTop: '10px' }}>
              <h4>Liste des échecs (Salles ou Profs indisponibles) :</h4>
              <ul>
                {resultat.echecs.map((e, index) => (
                  <li key={index}>{e.type_seance_souhaitee} (Prof: {e.enseignant_id}, Effectif demandé: {e.effectif})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminGeneration;