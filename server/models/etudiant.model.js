const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

exports.findAll = () =>
  dbAll(`
    SELECT e.*, u.nom, u.prenom, u.email
    FROM Etudiant e
    JOIN Utilisateur u ON e.id = u.id
    ORDER BY u.nom ASC
  `);

exports.findById = (id) =>
  dbGet(`
    SELECT e.*, u.nom, u.prenom, u.email
    FROM Etudiant e
    JOIN Utilisateur u ON e.id = u.id
    WHERE e.id = ?
  `, [id]);

exports.create = ({ id, numeroEtudiant, annee = null, filiere = null, cohorte_id = null }) =>
  dbRun(
    `INSERT INTO Etudiant (id, numeroEtudiant, annee, filiere, cohorte_id)
     VALUES (?, ?, ?, ?, ?)`,
    [id, numeroEtudiant, annee, filiere, cohorte_id]
  );

exports.update = (id, data) =>
  dbRun(
    `UPDATE Etudiant
     SET numeroEtudiant = ?, annee = ?, filiere = ?, cohorte_id = ?
     WHERE id = ?`,
    [data.numeroEtudiant, data.annee, data.filiere, data.cohorte_id, id]
  );

exports.remove = (id) =>
  dbRun(`DELETE FROM Etudiant WHERE id = ?`, [id]);