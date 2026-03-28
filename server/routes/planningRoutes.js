const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/planningController");

const { authorizeRoles, authorizeSelfOrRoles } = authMiddleware;

router.get(
  "/cohorte/:id",
  authMiddleware,
  authorizeRoles("etudiant", "enseignant", "administratif"),
  asyncHandler(controller.getByCohorteId)
);

router.get(
  "/enseignant/:id",
  authMiddleware,
  authorizeSelfOrRoles("id", "administratif"),
  asyncHandler(controller.getByEnseignantId)
);

router.get(
  "/seance/:id",
  authMiddleware,
  authorizeRoles("etudiant", "enseignant", "administratif"),
  asyncHandler(controller.getSeanceById)
);

module.exports = router;