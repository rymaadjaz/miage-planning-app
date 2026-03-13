const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = async (filters = {}) => {
  const where = ["isActive=1"];
  const params = [];

  if (filters.type) {
    where.push("type=?");
    params.push(filters.type);
  }
  if (filters.capacityMin) {
    where.push("capacite>=?");
    params.push(Number(filters.capacityMin));
  }
  if (filters.pmr !== undefined) {
    where.push("accessiblePMR=?");
    params.push(filters.pmr ? 1 : 0);
  }

  return dbAll(
    `SELECT * FROM salles WHERE ${where.join(" AND ")} ORDER BY nom ASC`,
    params
  );
};

exports.findById = (id) => dbGet("SELECT * FROM salles WHERE id=? AND isActive=1", [id]);

exports.create = ({ nom, capacite, type, accessiblePMR = 0 }) =>
  dbRun(
    `INSERT INTO salles (nom, capacite, type, accessiblePMR) VALUES (?, ?, ?, ?)`,
    [nom, capacite, type, accessiblePMR ? 1 : 0]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE salles SET nom=?, capacite=?, type=?, accessiblePMR=? WHERE id=?`,
    [data.nom, data.capacite, data.type, data.accessiblePMR ? 1 : 0, id]
  );

exports.softDelete = (id) => dbRun(`UPDATE salles SET isActive=0 WHERE id=?`, [id]);