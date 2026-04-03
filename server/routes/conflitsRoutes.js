const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const conflitsController = require("../controllers/conflitsController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(conflitsController.getAll)
);

router.get(
  "/unresolved",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(conflitsController.getUnresolved)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(conflitsController.getById)
);

router.patch(
  "/:id/resolve",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(conflitsController.resolve)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(conflitsController.remove)
);

module.exports = router;