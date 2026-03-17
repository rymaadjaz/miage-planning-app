const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`SELECT * FROM Disponibilite ORDER BY jour ASC, heureDebut ASC`);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Disponibilite WHERE id = ?`, [id]);

exports.findByEnseignant = (enseignantId) =>
  dbAll(
    `SELECT * FROM Disponibilite
     WHERE enseignant_id = ?
     ORDER BY jour ASC, heureDebut ASC`,
    [enseignantId]
  );

exports.create = ({ enseignant_id, jour, heureDebut, heureFin, disponible = 1 }) =>
  dbRun(
    `INSERT INTO Disponibilite (enseignant_id, jour, heureDebut, heureFin, disponible)
     VALUES (?, ?, ?, ?, ?)`,
    [enseignant_id, jour, heureDebut, heureFin, disponible ? 1 : 0]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Disponibilite
     SET enseignant_id = ?, jour = ?, heureDebut = ?, heureFin = ?, disponible = ?
     WHERE id = ?`,
    [data.enseignant_id, data.jour, data.heureDebut, data.heureFin, data.disponible ? 1 : 0, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Disponibilite WHERE id = ?`, [id]);