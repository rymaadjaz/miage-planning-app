const ApiError = require("../utils/ApiError");
const reservationModel = require("../models/reservation.model");
const reservationService = require("../services/reservation.service");

exports.getAll = async (req, res) => {
  const rows = await reservationModel.getAllDetailed();
  res.json(rows);
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const row = await reservationModel.findById(id);
  if (!row) throw new ApiError(404, "Réservation introuvable");

  res.json(row);
};

exports.create = async (req, res) => {
  const { salle_id, seance_id, motif = null } = req.body;

  const salleId = Number(salle_id);
  const seanceId = Number(seance_id);

  if (!Number.isInteger(salleId) || !Number.isInteger(seanceId)) {
    throw new ApiError(400, "Champs invalides (salle_id/seance_id)");
  }

  const result = await reservationService.createReservation({
    salle_id: salleId,
    seance_id: seanceId,
    created_by: req.user?.id ?? null,
    motif,
  });

  res.status(201).json(result);
};

exports.update = async (req, res) => {
  const reservationId = Number(req.params.id);
  if (!Number.isInteger(reservationId)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const { salle_id, seance_id, motif } = req.body;

  if (
    salle_id === undefined &&
    seance_id === undefined &&
    motif === undefined
  ) {
    throw new ApiError(400, "Aucune donnée à mettre à jour");
  }

  const result = await reservationService.updateReservation(
    reservationId,
    {
      salle_id: salle_id !== undefined ? Number(salle_id) : undefined,
      seance_id: seance_id !== undefined ? Number(seance_id) : undefined,
      motif,
    },
    req.user?.id ?? null
  );

  res.json(result);
};

exports.cancel = async (req, res) => {
  const reservationId = Number(req.params.id);
  if (!Number.isInteger(reservationId)) {
    throw new ApiError(400, "Id réservation invalide");
  }

  const result = await reservationService.cancelReservation(
    reservationId,
    req.user?.id ?? null
  );

  res.json(result);
};