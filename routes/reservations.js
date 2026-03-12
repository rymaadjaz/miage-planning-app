const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const { requireAuth } = require("../middleware/authMiddleware");

const controller = require("../controllers/reservationsController");

router.get("/", asyncHandler(controller.getAll));

router.post(
  "/",
  requireAuth,
  validate(["salle_id", "seance_id", "heure_debut", "heure_fin"]),
  asyncHandler(controller.create)
);

router.put(
  "/:id",
  requireAuth,
  validate(["salle_id", "heure_debut", "heure_fin"]),
  asyncHandler(controller.update)
);

router.patch("/:id/cancel", requireAuth, asyncHandler(controller.cancel));

module.exports = router;