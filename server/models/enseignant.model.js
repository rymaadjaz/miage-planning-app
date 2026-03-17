const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT e.*, u.nom, u.prenom, u.email
    FROM Enseignant e
    JOIN Utilisateur u ON e.id = u.id
    ORDER BY u.nom ASC
  `);

exports.findById = (id) =>
  dbGet(`
    SELECT e.*, u.nom, u.prenom, u.email
    FROM Enseignant e
    JOIN Utilisateur u ON e.id = u.id
    WHERE e.id = ?
  `, [id]);

exports.create = ({ id, grade = null, service = null }) =>
  dbRun(
    `INSERT INTO Enseignant (id, grade, service)
     VALUES (?, ?, ?)`,
    [id, grade, service]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Enseignant
     SET grade = ?, service = ?
     WHERE id = ?`,
    [data.grade, data.service, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Enseignant WHERE id = ?`, [id]);