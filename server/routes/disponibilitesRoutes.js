const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const disponibilitesController = require("../controllers/disponibilitesController");

const { authorizeRoles, authorizeSelfOrRoles } = authMiddleware;

router.get(
  "/enseignant/:id",
  authMiddleware,
  authorizeSelfOrRoles("id", "administratif"),
  asyncHandler(disponibilitesController.getByEnseignantId)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(disponibilitesController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(disponibilitesController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(disponibilitesController.remove)
);

module.exports = router;