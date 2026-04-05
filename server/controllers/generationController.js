const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

// Les jours et créneaux standards de l'université
const JOURS_SEMAINE = ['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10']; // Du Lundi au Vendredi
const CRENEAUX = ['08:00', '10:00', '14:00', '16:00']; // Créneaux de 2h
const DUREE_STANDARD = 120; // 120 minutes

exports.genererEDTGlouton = async (req, res) => {
  try {
    console.log("🚀 Démarrage de l'algorithme Glouton...");

    // 1. Récupération des données de base
    const salles = await dbAll("SELECT * FROM Salle ORDER BY capacite DESC"); // On trie les salles de la plus grande à la plus petite
    
    // ⚠️ On récupère les demandes de cours à placer (ici on prend les réservations en attente d'ajout, 
    // mais tu peux adapter pour prendre une table "Maquette_Pedagogique")
    let coursAPlacer = await dbAll(`
      SELECT r.*, c.effectif 
      FROM Reservation r
      JOIN Cohorte c ON r.cohorte_id = c.id
      WHERE r.statut = 'EN_ATTENTE' AND r.type_demande = 'AJOUT'
    `);

    // 2. L'HEURISTIQUE DU GLOUTON : Le tri ! 
    // On trie par priorité (CM avant TD/TP) puis par effectif décroissant
    const PRIORITY = { "EXAMEN": 4, "CM": 3, "TD": 2, "TP": 1 };
    
    coursAPlacer.sort((a, b) => {
      const prioA = PRIORITY[a.type_seance_souhaitee] || 0;
      const prioB = PRIORITY[b.type_seance_souhaitee] || 0;
      if (prioB !== prioA) return prioB - prioA; // Priorité type de cours
      return b.effectif - a.effectif; // Priorité grosse cohorte
    });

    const succes = [];
    const echecs = [];

    // 3. LA BOUCLE PRINCIPALE GLOUTONNE
    for (const cours of coursAPlacer) {
      let estPlace = false;

      // On parcourt chaque jour, chaque créneau, chaque salle (Le premier trou trouvé est le bon)
      for (const jour of JOURS_SEMAINE) {
        if (estPlace) break;

        for (const heure of CRENEAUX) {
          if (estPlace) break;

          for (const salle of salles) {
            // Contrainte 1 : La capacité de la salle
            if (salle.capacite < cours.effectif) continue; // Salle trop petite, on passe à la suivante

            // Contrainte 2 : Vérifier les chevauchements (Salle, Prof, ou Cohorte déjà occupés ?)
            const conflit = await dbGet(`
              SELECT id FROM Seance 
              WHERE dateSeance = ? AND heureDebut = ? AND statut = 'VALIDE'
              AND (salle_id = ? OR enseignant_id = ? OR cohorte_id = ?)
            `, [jour, heure, salle.id, cours.enseignant_id, cours.cohorte_id]);

            if (!conflit) {
              // AUCUN CONFLIT ! On applique notre choix glouton immédiatement.
              const result = await dbRun(`
                INSERT INTO Seance (dateSeance, heureDebut, duree, typeSeance, statut, description, cohorte_id, enseignant_id, salle_id, matiere_id)
                VALUES (?, ?, ?, ?, 'VALIDE', ?, ?, ?, ?, ?)
              `, [
                jour, heure, DUREE_STANDARD, cours.type_seance_souhaitee, 
                "Généré auto (Glouton)", cours.cohorte_id, cours.enseignant_id, salle.id, cours.matiere_id
              ]);

              // On met à jour la réservation d'origine
              await dbRun("UPDATE Reservation SET statut = 'VALIDEE', seance_id = ? WHERE id = ?", [result.lastID, cours.id]);

              estPlace = true;
              succes.push({ ...cours, jour, heure, salle: salle.nom });
              break; // On a trouvé, on sort de la boucle des salles
            }
          }
        }
      }

      // Si après avoir testé tous les jours et toutes les salles, estPlace est toujours false :
      if (!estPlace) {
        echecs.push(cours);
      }
    }

    console.log(`✅ Génération terminée : ${succes.length} placés, ${echecs.length} échecs.`);
    
    res.json({
      message: "Algorithme glouton exécuté avec succès",
      stats: { places: succes.length, echecs: echecs.length },
      succes,
      echecs
    });

  } catch (error) {
    console.error("❌ ERREUR GLOUTON :", error);
    res.status(500).json({ message: error.message });
  }
};