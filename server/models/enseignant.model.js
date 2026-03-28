const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT
      e.id,
      e.grade,
      e.service,
      u.nom,
      u.prenom,
      u.email,
      u.role,
      u.created_at
    FROM Enseignant e
    JOIN Utilisateur u ON e.id = u.id
    ORDER BY u.nom ASC, u.prenom ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT
      e.id,
      e.grade,
      e.service,
      u.nom,
      u.prenom,
      u.email,
      u.role,
      u.created_at
    FROM Enseignant e
    JOIN Utilisateur u ON e.id = u.id
    WHERE e.id = ?
    `,
    [id]
  );

exports.create = ({ id, grade = null, service = null }) =>
  dbRun(
    `
    INSERT INTO Enseignant (id, grade, service)
    VALUES (?, ?, ?)
    `,
    [id, grade, service]
  );

exports.update = (id, { grade, service }) =>
  dbRun(
    `
    UPDATE Enseignant
    SET
      grade = ?,
      service = ?
    WHERE id = ?
    `,
    [grade, service, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Enseignant
    WHERE id = ?
    `,
    [id]
  );