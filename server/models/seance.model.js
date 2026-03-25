const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT
      se.*,
      co.nom AS cohorte_nom
    FROM Seance se
    LEFT JOIN Cohorte co ON se.cohorte_id = co.id
    ORDER BY se.dateSeance ASC, se.heureDebut ASC
  `);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Seance WHERE id = ?`, [id]);

exports.create = ({
  dateSeance,
  heureDebut,
  duree,
  typeSeance,
  statut = "PLANIFIE",
  matiere_id = null,
  cohorte_id,
  enseignant_id,
}) =>
  dbRun(
    `INSERT INTO Seance
      (dateSeance, heureDebut, duree, typeSeance, statut, matiere_id, cohorte_id, enseignant_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [dateSeance, heureDebut, duree, typeSeance, statut, matiere_id, cohorte_id, enseignant_id]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Seance
     SET dateSeance = ?, heureDebut = ?, duree = ?, typeSeance = ?, statut = ?, matiere_id = ?, cohorte_id = ?, enseignant_id = ?
     WHERE id = ?`,
    [
      data.dateSeance,
      data.heureDebut,
      data.duree,
      data.typeSeance,
      data.statut,
      data.matiere_id,
      data.cohorte_id,
      data.enseignant_id,
      id,
    ]
  );

exports.cancel = (id) =>
  dbRun(`UPDATE Seance SET statut = 'ANNULE' WHERE id = ?`, [id]);