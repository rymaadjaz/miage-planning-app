const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const seancesController = require("../controllers/seancesController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(seancesController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("enseignant", "administratif"),
  asyncHandler(seancesController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(seancesController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(seancesController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(seancesController.remove)
);

module.exports = router;