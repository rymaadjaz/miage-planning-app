const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const equipementsController = require("../controllers/equipementsController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(equipementsController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(equipementsController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(equipementsController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(equipementsController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(equipementsController.remove)
);

module.exports = router;