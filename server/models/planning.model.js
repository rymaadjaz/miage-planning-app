const { dbAll, dbGet } = require("../db/dbAsync");

exports.findByCohorteId = (cohorteId) =>
  dbAll(
    `
    SELECT
      se.id,
      se.dateSeance,
      se.heureDebut,
      se.duree,
      se.typeSeance,
      se.statut,
      se.description,
      m.nom AS matiere,
      c.nom AS cohorte_nom,
      u.nom AS enseignant_nom,
      u.prenom AS enseignant_prenom,
      s.code AS salle
    FROM Seance se
    LEFT JOIN Matiere m ON se.matiere_id = m.id
    LEFT JOIN Cohorte c ON se.cohorte_id = c.id
    LEFT JOIN Utilisateur u ON se.enseignant_id = u.id
    LEFT JOIN Reservation r
      ON r.seance_id = se.id
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE')
    LEFT JOIN Salle s ON r.salle_id = s.id
    WHERE se.cohorte_id = ?
      AND se.statut != 'ANNULE'
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
    `,
    [cohorteId]
  );

exports.findByEnseignantId = (enseignantId) =>
  dbAll(
    `
    SELECT
      se.id,
      se.dateSeance,
      se.heureDebut,
      se.duree,
      se.typeSeance,
      se.statut,
      se.description,
      m.nom AS matiere,
      c.nom AS cohorte_nom,
      u.nom AS enseignant_nom,
      u.prenom AS enseignant_prenom,
      s.code AS salle
    FROM Seance se
    LEFT JOIN Matiere m ON se.matiere_id = m.id
    LEFT JOIN Cohorte c ON se.cohorte_id = c.id
    LEFT JOIN Utilisateur u ON se.enseignant_id = u.id
    LEFT JOIN Reservation r
      ON r.seance_id = se.id
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE')
    LEFT JOIN Salle s ON r.salle_id = s.id
    WHERE se.enseignant_id = ?
      AND se.statut != 'ANNULE'
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
    `,
    [enseignantId]
  );

exports.findSeanceById = (seanceId) =>
  dbGet(
    `
    SELECT
      se.id,
      se.dateSeance,
      se.heureDebut,
      se.duree,
      se.typeSeance,
      se.statut,
      se.description,
      m.nom AS matiere,
      c.nom AS cohorte_nom,
      u.nom AS enseignant_nom,
      u.prenom AS enseignant_prenom,
      s.code AS salle
    FROM Seance se
    LEFT JOIN Matiere m ON se.matiere_id = m.id
    LEFT JOIN Cohorte c ON se.cohorte_id = c.id
    LEFT JOIN Utilisateur u ON se.enseignant_id = u.id
    LEFT JOIN Reservation r
      ON r.seance_id = se.id
      AND r.type_demande = 'MODIFICATION'
      AND r.statut IN ('PLANIFIEE', 'VALIDEE')
    LEFT JOIN Salle s ON r.salle_id = s.id
    WHERE se.id = ?
    `,
    [seanceId]
  );