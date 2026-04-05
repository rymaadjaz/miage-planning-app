import React, { useState, useEffect } from "react";
import { request } from "../../services/api";
import "../styles/AdminConflits.css";

export default function AdminConflits() {
  const [conflits, setConflits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConflits = async () => {
    setLoading(true);
    try {
      const response = await request("/api/conflits/unresolved", { auth: true });      
      // 🚀 LE MOUCHARD FRONTEND : Regarde dans la console (F12) de ton navigateur !
      console.log("📥 Données reçues du backend :", response);

      // 🛡️ SÉCURITÉ : On s'assure de toujours avoir un tableau pour éviter que .map() ne plante
      if (Array.isArray(response)) {
        setConflits(response);
      } else if (response && Array.isArray(response.data)) {
        setConflits(response.data);
      } else {
        setConflits([]); // Fallback par défaut
        console.error("⚠️ Format de données inattendu :", response);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des conflits", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflits();
  }, []);

  // 🚀 LA NOUVELLE FONCTION "TRANCHER" (L'ancienne a été supprimée pour éviter le doublon)
  const handleForceReservation = async (conflitId, reservationId, seanceGênanteId) => {
    // 🔍 LE MOUCHARD : Ouvre ta console (F12) pour voir si ces IDs s'affichent
    console.log("🚀 Tentative d'arbitrage :", { 
      conflit: conflitId, 
      examenAReserver: reservationId, 
      coursA_Deplacer: seanceGênanteId 
    });

    // 🛡️ SÉCURITÉ : Si l'ID est absent, on arrête tout avant de faire planter le serveur
    if (!reservationId) {
      alert("❌ Erreur : Ce conflit n'est pas lié à une réservation (ID manquant dans la BD).\n\nAction : Supprimez ce conflit et refaites un test après avoir vidé vos tables.");
      return;
    }

    // 1. Demander les nouvelles infos
    const nouvelleDate = window.prompt(
      "⚡ ARBITRAGE PRIORITÉ ⚡\n\nL'examen va prendre la place du cours normal.\nÀ quelle NOUVELLE DATE voulez-vous déplacer le cours gênant ?\n(Ex: 2024-12-25)\n\nLaissez vide pour ANNULER le cours."
    );
    
    let nouvelleHeure = null;
    if (nouvelleDate) {
       nouvelleHeure = window.prompt("À quelle NOUVELLE HEURE ? (Ex: 14:00)");
    }

    try {
      // 1. On récupère ton token de connexion (souvent stocké ici)
      const token = localStorage.getItem("token"); 

      // 2. On utilise le vrai "fetch" de Javascript pour forcer l'envoi
      const res = await fetch(`http://localhost:5000/api/conflits/${conflitId}/trancher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // C'est ça qui remplace ton "auth: true"
        },
        body: JSON.stringify({
          reservation_exam_id: reservationId, 
          seance_old_id: seanceGênanteId,     
          nouvelleDate: nouvelleDate || null,
          nouvelleHeure: nouvelleHeure || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'arbitrage côté serveur");
      }

      console.log("✅ Réponse serveur :", data);
      alert("✅ Arbitrage terminé avec succès !");
      fetchConflits(); // On rafraîchit le tableau

    } catch (err) {
      console.error("❌ Erreur API :", err);
      alert("Erreur lors de l'arbitrage : " + err.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await request(`/api/conflits/${id}/resolve`, { method: "PATCH", auth: true });
      alert("✅ Conflit marqué comme résolu !");
      fetchConflits(); 
    } catch (err) {
      alert("Erreur lors de la résolution : " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce conflit de l'historique ?")) {
      try {
        // CORRECTION : J'ai ajouté le /api manquant ici !
        await request(`/api/conflits/${id}`, { method: "DELETE", auth: true });
        fetchConflits();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="admin-conflits-page">
      <div className="admin-conflits-header">
        <h2 className="admin-conflits-title">Gestion des Conflits</h2>
      </div>

      <div className="admin-conflits-panel">
        {loading ? (
          <p className="admin-conflits-loading">Analyse des emplois du temps...</p>
        ) : conflits.length === 0 ? (
          <div className="admin-conflits-empty">✅ Aucun conflit non résolu pour le moment.</div>
        ) : (
          <div className="admin-conflits-table-wrap">
            <table className="admin-conflits-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description du problème</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conflits.map((c) => (
                <tr key={c.id}>
                  <td>
                    {/* On ajoute une couleur spéciale pour le type PRIORITE */}
                    <span className={`admin-conflits-type-badge ${
                      c.type === 'CAPACITE' ? 'admin-conflits-type-badge--capacite' : 
                      c.type === 'PRIORITE' ? 'admin-conflits-type-badge--priorite' : 
                      'admin-conflits-type-badge--default'
                    }`}>
                      {c.type}
                    </span>
                  </td>
                  <td>
                    <strong className="admin-conflits-description">{c.description}</strong>
                    <div className="admin-conflits-meta">
                      {c.enseignant_nom ? `Prof: ${c.enseignant_nom}` : "Système"} 
                      {c.reservation_id ? ` | Résa ID: ${c.reservation_id}` : ""}
                    </div>
                  </td>
                  <td className="admin-conflits-date">{c.created_at ? new Date(c.created_at).toLocaleString() : "Date inconnue"}</td>
                 <td>
                    <div className="admin-conflits-actions">
                      {c.type === 'PRIORITE' && c.reservation_id && (
                        <button 
                          className="admin-conflits-btn admin-conflits-btn--warning"
                          onClick={() => handleForceReservation(c.id, c.reservation_id, c.seance_id_1)}                        >
                          Trancher (Forcer)
                        </button>
                      )}
                      
                      <button className="admin-conflits-btn admin-conflits-btn--primary" onClick={() => handleResolve(c.id)}>
                        Ignorer (Résolu)
                      </button>
                      <button className="admin-conflits-btn admin-conflits-btn--secondary" onClick={() => handleDelete(c.id)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}