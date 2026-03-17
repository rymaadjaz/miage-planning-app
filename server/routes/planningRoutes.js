const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const controller = require("../controllers/planningController");

router.get("/cohorte/:cohorteId", asyncHandler(controller.getByCohorte));
router.get("/enseignant/:enseignantId", asyncHandler(controller.getByEnseignant));
router.get("/salle/:salleId", asyncHandler(controller.getBySalle));

module.exports = router;