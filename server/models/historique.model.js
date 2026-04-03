const { dbAll, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT *
    FROM Historique
    ORDER BY date_action DESC
  `);

exports.findByEntity = (entite, entite_id) =>
  dbAll(
    `
    SELECT *
    FROM Historique
    WHERE entite = ? AND entite_id = ?
    ORDER BY date_action DESC
    `,
    [entite, entite_id]
  );

exports.create = ({ auteur_id = null, entite, entite_id, action, detail = null }) =>
  dbRun(
    `
    INSERT INTO Historique (auteur_id, entite, entite_id, action, detail)
    VALUES (?, ?, ?, ?, ?)
    `,
    [auteur_id, entite, entite_id, action, detail]
  );