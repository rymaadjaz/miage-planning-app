const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT e.*, s.code AS salle_code
    FROM Equipement e
    JOIN Salle s ON e.salle_id = s.id
    ORDER BY e.nom ASC
  `);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Equipement WHERE id = ?`, [id]);

exports.findBySalle = (salleId) =>
  dbAll(`SELECT * FROM Equipement WHERE salle_id = ? ORDER BY nom ASC`, [salleId]);

exports.create = ({ nom, salle_id }) =>
  dbRun(
    `INSERT INTO Equipement (nom, salle_id)
     VALUES (?, ?)`,
    [nom, salle_id]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Equipement
     SET nom = ?, salle_id = ?
     WHERE id = ?`,
    [data.nom, data.salle_id, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Equipement WHERE id = ?`, [id]);