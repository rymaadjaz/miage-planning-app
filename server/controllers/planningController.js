const ApiError = require("../utils/ApiError");
const { dbAll, dbGet } = require("../db/dbAsync");

function pad(n) {
  return String(n).padStart(2, "0");
}

function computeEndTime(date, startTime, durationMinutes) {
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + Number(durationMinutes || 0) * 60000);
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function formatPlanningRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    matiere: row.matiere,
    titre: row.description || row.matiere || "Séance",
    salle: row.salle,
    date: row.dateSeance,
    debut: row.heureDebut,
    fin: computeEndTime(row.dateSeance, row.heureDebut, row.duree),
    type: row.typeSeance === "EXAMEN" ? "EXAM" : row.typeSeance,
    enseignant: row.enseignant_nom
      ? `${row.enseignant_prenom} ${row.enseignant_nom}`
      : null,
    cohorte: row.cohorte_nom || null,
    description: row.description || null,
    statut: row.statut,
    duree: row.duree,
  }));
}

exports.getByCohorteId = async (req, res) => {
  const cohorteId = Number(req.params.id);

  if (!Number.isInteger(cohorteId)) {
    throw new ApiError(400, "Id cohorte invalide");
  }

  const rows = await dbAll(
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

  res.json(formatPlanningRows(rows));
};

exports.getByEnseignantId = async (req, res) => {
  const enseignantId = Number(req.params.id);

  if (!Number.isInteger(enseignantId)) {
    throw new ApiError(400, "Id enseignant invalide");
  }

  const rows = await dbAll(
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

  res.json(formatPlanningRows(rows));
};

exports.getSeanceById = async (req, res) => {
  const seanceId = Number(req.params.id);

  if (!Number.isInteger(seanceId)) {
    throw new ApiError(400, "Id séance invalide");
  }

  const row = await dbGet(
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

  if (!row) {
    throw new ApiError(404, "Séance introuvable");
  }

  res.json(formatPlanningRows([row])[0]);
};