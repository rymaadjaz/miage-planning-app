const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Conflit
    ORDER BY created_at DESC
  `);

exports.findOpen = () =>
  dbAll(`
    SELECT *
    FROM Conflit
    WHERE resolu = 0
    ORDER BY created_at DESC
  `);

exports.findById = (id) =>
  dbGet(`SELECT * FROM Conflit WHERE id = ?`, [id]);

exports.create = ({
  type,
  description,
  reservation_id = null,
  seance_id_1 = null,
  seance_id_2 = null,
}) =>
  dbRun(
    `INSERT INTO Conflit (type, description, reservation_id, seance_id_1, seance_id_2)
     VALUES (?, ?, ?, ?, ?)`,
    [type, description, reservation_id, seance_id_1, seance_id_2]
  );

exports.resolve = (id) =>
  dbRun(`UPDATE Conflit SET resolu = 1 WHERE id = ?`, [id]);