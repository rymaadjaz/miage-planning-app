const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const enseignantsController = require("../controllers/enseignantsController");

const { authorizeRoles, authorizeSelfOrRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(enseignantsController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeSelfOrRoles("id", "administratif"),
  asyncHandler(enseignantsController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(enseignantsController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(enseignantsController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(enseignantsController.remove)
);

module.exports = router;