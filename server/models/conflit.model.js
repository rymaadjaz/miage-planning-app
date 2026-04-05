const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Conflit
    ORDER BY created_at DESC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Conflit
    WHERE id = ?
    `,
    [id]
  );

// 1. On force resolu = 0 à la création
exports.create = ({
  type,
  description,
  reservation_id = null,
  seance_id_1 = null,
  seance_id_2 = null,
}) =>
  dbRun(
    `
    INSERT INTO Conflit (type, description, reservation_id, seance_id_1, seance_id_2, resolu)
    VALUES (?, ?, ?, ?, ?, 0)
    `,
    [type, description, reservation_id, seance_id_1, seance_id_2]
  );

exports.findUnresolved = () =>
  dbAll(`
    SELECT 
      c.*, 
      u.nom AS enseignant_nom, 
      u.prenom AS enseignant_prenom,
      co.nom AS cohorte_nom
    FROM Conflit c
    LEFT JOIN Reservation r ON c.reservation_id = r.id
    LEFT JOIN Utilisateur u ON r.enseignant_id = u.id
    LEFT JOIN Cohorte co ON r.cohorte_id = co.id
    WHERE (c.resolu = 0 OR c.resolu IS NULL)
    ORDER BY c.created_at DESC
  `);
exports.markResolved = (id) =>
  dbRun(
    `
    UPDATE Conflit
    SET resolu = 1
    WHERE id = ?
    `,
    [id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Conflit
    WHERE id = ?
    `,
    [id]
  );