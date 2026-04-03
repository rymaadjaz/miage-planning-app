const ApiError = require("../utils/ApiError");
const notificationModel = require("../models/notification.model");

const ROLES_VALIDES = ["enseignant", "etudiant", "administratif"];
const STATUS_VALIDES = ["nouveau", "lu", "important"];
const ICONS_VALIDES = ["info", "location", "check", "warning"];

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function canAccessNotification(user, notificationRole) {
  const currentRole = normalizeString(user?.role);
  const targetRole = normalizeString(notificationRole);

  if (!currentRole) return false;
  if (currentRole === "administratif") return true;

  return currentRole === targetRole;
}

exports.getAll = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  let role = normalizeString(req.query.role);
  if (!role) {
    role = normalizeString(req.user.role);
  }

  if (!ROLES_VALIDES.includes(role)) {
    throw new ApiError(400, "Rôle invalide");
  }

  if (
    normalizeString(req.user.role) !== "administratif" &&
    normalizeString(req.user.role) !== role
  ) {
    throw new ApiError(403, "Accès interdit");
  }

  const rows = await notificationModel.findAllByRole(role);
  res.json(rows);
};

exports.getById = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id notification invalide");
  }

  const row = await notificationModel.findById(id);
  if (!row) {
    throw new ApiError(404, "Notification introuvable");
  }

  if (!canAccessNotification(req.user, row.role)) {
    throw new ApiError(403, "Accès interdit");
  }

  res.json(row);
};

exports.create = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  const {
    role,
    status = "nouveau",
    titre,
    message,
    date,
    iconType = "info",
  } = req.body;

  if (!ROLES_VALIDES.includes(normalizeString(role))) {
    throw new ApiError(400, "Rôle invalide");
  }

  if (!STATUS_VALIDES.includes(normalizeString(status))) {
    throw new ApiError(400, "Status invalide");
  }

  if (!ICONS_VALIDES.includes(normalizeString(iconType))) {
    throw new ApiError(400, "iconType invalide");
  }

  if (!titre || !String(titre).trim()) {
    throw new ApiError(400, "Titre requis");
  }

  if (!message || !String(message).trim()) {
    throw new ApiError(400, "Message requis");
  }

  const result = await notificationModel.create({
    role: normalizeString(role),
    status: normalizeString(status),
    titre: String(titre).trim(),
    message: String(message).trim(),
    date: date || new Date().toISOString(),
    iconType: normalizeString(iconType),
  });

  res.status(201).json({
    message: "Notification créée avec succès",
    id: result.lastID,
  });
};

exports.markAsRead = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id notification invalide");
  }

  const existing = await notificationModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Notification introuvable");
  }

  if (!canAccessNotification(req.user, existing.role)) {
    throw new ApiError(403, "Accès interdit");
  }

  await notificationModel.updateStatus(id, "lu");

  res.json({
    message: "Notification marquée comme lue",
    id,
  });
};

exports.remove = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Utilisateur non authentifié");
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id notification invalide");
  }

  const existing = await notificationModel.findById(id);
  if (!existing) {
    throw new ApiError(404, "Notification introuvable");
  }

  if (normalizeString(req.user.role) !== "administratif") {
    throw new ApiError(403, "Accès interdit");
  }

  await notificationModel.remove(id);

  res.json({
    message: "Notification supprimée",
    id,
  });
};