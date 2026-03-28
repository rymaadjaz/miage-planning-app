const { dbGet } = require("../db/dbAsync");

exports.findByEmail = (email) =>
  dbGet(
    `
    SELECT *
    FROM Utilisateur
    WHERE email = ?
    `,
    [email]
  );

exports.findById = (id) =>
  dbGet(
    `
    SELECT id, nom, prenom, email, role
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );