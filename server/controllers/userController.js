const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { dbAll, dbGet, dbRun } = require("../db/dbAsync");

const ROLES_VALIDES = ["etudiant", "enseignant", "administratif"];

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

exports.getMe = async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  const user = await dbGet(
    `
    SELECT id, nom, prenom, email, role, created_at
    FROM Utilisateur
    WHERE id = ?
    `,
    [req.user.id]
  );

  if (!user) {
    throw new ApiError(404, "Utilisateur introuvable");
  }

  res.json(user);
};

exports.getAll = async (_req, res) => {
  const rows = await dbAll(`
    SELECT id, nom, prenom, email, role, created_at
    FROM Utilisateur
    ORDER BY id ASC
  `);

  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id utilisateur invalide");
  }

  const user = await dbGet(
    `
    SELECT id, nom, prenom, email, role, created_at
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );

  if (!user) {
    throw new ApiError(404, "Utilisateur introuvable");
  }

  res.json(user);
};

exports.create = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, role } = req.body;

  if (!nom || !prenom || !email || !mot_de_passe || !role) {
    throw new ApiError(400, "Champs requis manquants");
  }

  const finalRole = normalizeRole(role);
  if (!ROLES_VALIDES.includes(finalRole)) {
    throw new ApiError(400, "Rôle invalide");
  }

  const existing = await dbGet(
    `
    SELECT id
    FROM Utilisateur
    WHERE email = ?
    `,
    [String(email).trim()]
  );

  if (existing) {
    throw new ApiError(409, "Cet email existe déjà");
  }

  const hashedPassword = await bcrypt.hash(String(mot_de_passe), 10);

  const result = await dbRun(
    `
    INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      String(nom).trim(),
      String(prenom).trim(),
      String(email).trim(),
      hashedPassword,
      finalRole,
    ]
  );

  const created = await dbGet(
    `
    SELECT id, nom, prenom, email, role, created_at
    FROM Utilisateur
    WHERE id = ?
    `,
    [result.lastID]
  );

  res.status(201).json({
    message: "Utilisateur créé avec succès",
    user: created,
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id utilisateur invalide");
  }

  const existing = await dbGet(
    `
    SELECT *
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Utilisateur introuvable");
  }

  const finalNom = req.body.nom ?? existing.nom;
  const finalPrenom = req.body.prenom ?? existing.prenom;
  const finalEmail = req.body.email ?? existing.email;
  const finalRole = req.body.role ? normalizeRole(req.body.role) : existing.role;

  if (!ROLES_VALIDES.includes(finalRole)) {
    throw new ApiError(400, "Rôle invalide");
  }

  const emailOwner = await dbGet(
    `
    SELECT id
    FROM Utilisateur
    WHERE email = ? AND id != ?
    `,
    [String(finalEmail).trim(), id]
  );

  if (emailOwner) {
    throw new ApiError(409, "Cet email est déjà utilisé");
  }

  let finalPassword = existing.mot_de_passe;
  if (req.body.mot_de_passe) {
    finalPassword = await bcrypt.hash(String(req.body.mot_de_passe), 10);
  }

  await dbRun(
    `
    UPDATE Utilisateur
    SET
      nom = ?,
      prenom = ?,
      email = ?,
      mot_de_passe = ?,
      role = ?
    WHERE id = ?
    `,
    [
      String(finalNom).trim(),
      String(finalPrenom).trim(),
      String(finalEmail).trim(),
      finalPassword,
      finalRole,
      id,
    ]
  );

  const updated = await dbGet(
    `
    SELECT id, nom, prenom, email, role, created_at
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    message: "Utilisateur mis à jour",
    user: updated,
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id utilisateur invalide");
  }

  const existing = await dbGet(
    `
    SELECT id
    FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );

  if (!existing) {
    throw new ApiError(404, "Utilisateur introuvable");
  }

  await dbRun(
    `
    DELETE FROM Utilisateur
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    message: "Utilisateur supprimé",
    id,
  });
};