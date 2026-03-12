const reservationModel = require("../models/reservation.model");
const reservationService = require("../services/reservation.service");

exports.getAll = async (req, res) => {
  const rows = await reservationModel.getAllDetailed();
  res.json(rows);
};

exports.create = async (req, res) => {
  const { salle_id, seance_id, heure_debut, heure_fin } = req.body;

  const result = await reservationService.createReservation({
    salle_id: Number(salle_id),
    seance_id: Number(seance_id),
    heure_debut,
    heure_fin,
    created_by: req.user?.id ?? null,
  });

  res.status(201).json(result);
};

exports.update = async (req, res) => {
  const { salle_id, heure_debut, heure_fin } = req.body;

  const result = await reservationService.updateReservation(Number(req.params.id), {
    salle_id: Number(salle_id),
    heure_debut,
    heure_fin,
  });

  res.json(result);
};

exports.cancel = async (req, res) => {
  const result = await reservationService.cancelReservation(Number(req.params.id));
  res.json(result);
};
