const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Salle
    ORDER BY code ASC
  `);

exports.findById = (id) =>
  dbGet(
    `
    SELECT *
    FROM Salle
    WHERE id = ?
    `,
    [id]
  );

exports.findByCode = (code) =>
  dbGet(
    `
    SELECT *
    FROM Salle
    WHERE code = ?
    `,
    [code]
  );

exports.findActive = () =>
  dbAll(`
    SELECT *
    FROM Salle
    WHERE isActive = 1
    ORDER BY code ASC
  `);

exports.create = ({
  code,
  capacite,
  type,
  accessibilitePMR = 0,
  isActive = 1,
}) =>
  dbRun(
    `
    INSERT INTO Salle (code, capacite, type, accessibilitePMR, isActive)
    VALUES (?, ?, ?, ?, ?)
    `,
    [code, capacite, type, accessibilitePMR, isActive]
  );

exports.update = (
  id,
  { code, capacite, type, accessibilitePMR, isActive }
) =>
  dbRun(
    `
    UPDATE Salle
    SET
      code = ?,
      capacite = ?,
      type = ?,
      accessibilitePMR = ?,
      isActive = ?
    WHERE id = ?
    `,
    [code, capacite, type, accessibilitePMR, isActive, id]
  );

exports.remove = (id) =>
  dbRun(
    `
    DELETE FROM Salle
    WHERE id = ?
    `,
    [id]
  );