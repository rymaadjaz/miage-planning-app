const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = async (filters = {}) => {
  const where = ["isActive = 1"];
  const params = [];

  if (filters.type) {
    where.push("type = ?");
    params.push(filters.type);
  }

  if (filters.capacityMin) {
    where.push("capacite >= ?");
    params.push(Number(filters.capacityMin));
  }

  if (filters.pmr !== undefined) {
    where.push("accessibilitePMR = ?");
    params.push(filters.pmr ? 1 : 0);
  }

  return dbAll(
    `SELECT *
     FROM Salle
     WHERE ${where.join(" AND ")}
     ORDER BY code ASC`,
    params
  );
};

exports.findById = (id) =>
  dbGet(`SELECT * FROM Salle WHERE id = ? AND isActive = 1`, [id]);

exports.create = ({ code, capacite, type, accessibilitePMR = 0 }) =>
  dbRun(
    `INSERT INTO Salle (code, capacite, type, accessibilitePMR)
     VALUES (?, ?, ?, ?)`,
    [code, capacite, type, accessibilitePMR ? 1 : 0]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Salle
     SET code = ?, capacite = ?, type = ?, accessibilitePMR = ?
     WHERE id = ?`,
    [data.code, data.capacite, data.type, data.accessibilitePMR ? 1 : 0, id]
  );

exports.softDelete = (id) =>
  dbRun(`UPDATE Salle SET isActive = 0 WHERE id = ?`, [id]);