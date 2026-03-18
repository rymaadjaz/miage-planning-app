const ApiError = require("../utils/ApiError");
const { dbAll } = require("../db/dbAsync");

exports.getByCohorte = async (req, res) => {
  const cohorteId = Number(req.params.cohorteId);
  if (!Number.isInteger(cohorteId)) throw new ApiError(400, "Id cohorte invalide");

  const rows = await dbAll(
    `
    SELECT
      se.*,
      sa.code AS salle_code,
      ma.nom AS matiere_nom
    FROM Seance se
    LEFT JOIN Reservation r ON r.seance_id = se.id AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
    LEFT JOIN Salle sa ON sa.id = r.salle_id
    LEFT JOIN Matiere ma ON ma.id = se.matiere_id
    WHERE se.cohorte_id = ?
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
    `,
    [cohorteId]
  );

  res.json(rows);
};

exports.getByEnseignant = async (req, res) => {
  const enseignantId = Number(req.params.enseignantId);
  if (!Number.isInteger(enseignantId)) throw new ApiError(400, "Id enseignant invalide");

  const rows = await dbAll(
    `
    SELECT
      se.*,
      sa.code AS salle_code,
      ma.nom AS matiere_nom,
      co.nom AS cohorte_nom
    FROM Seance se
    LEFT JOIN Reservation r ON r.seance_id = se.id AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
    LEFT JOIN Salle sa ON sa.id = r.salle_id
    LEFT JOIN Matiere ma ON ma.id = se.matiere_id
    LEFT JOIN Cohorte co ON co.id = se.cohorte_id
    WHERE se.enseignant_id = ?
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
    `,
    [enseignantId]
  );

  res.json(rows);
};

exports.getBySalle = async (req, res) => {
  const salleId = Number(req.params.salleId);
  if (!Number.isInteger(salleId)) throw new ApiError(400, "Id salle invalide");

  const rows = await dbAll(
    `
    SELECT
      se.*,
      sa.code AS salle_code,
      ma.nom AS matiere_nom,
      co.nom AS cohorte_nom
    FROM Reservation r
    JOIN Seance se ON se.id = r.seance_id
    JOIN Salle sa ON sa.id = r.salle_id
    LEFT JOIN Matiere ma ON ma.id = se.matiere_id
    LEFT JOIN Cohorte co ON co.id = se.cohorte_id
    WHERE r.salle_id = ?
      AND r.statut IN ('PLANIFIEE', 'VALIDEE', 'EN_ATTENTE')
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
    `,
    [salleId]
  );

  res.json(rows);
};