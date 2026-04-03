const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const matieresController = require("../controllers/matieresController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(matieresController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(matieresController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(matieresController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(matieresController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(matieresController.remove)
);

module.exports = router;