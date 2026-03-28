const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/reservationsController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(controller.getAll)
);

router.get(
  "/front",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(controller.getFrontDemandes)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(controller.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(controller.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(controller.update)
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(controller.cancel)
);

module.exports = router;