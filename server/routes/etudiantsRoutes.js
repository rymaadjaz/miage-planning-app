const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const etudiantsController = require("../controllers/etudiantsController");

const { authorizeRoles, authorizeSelfOrRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(etudiantsController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeSelfOrRoles("id", "administratif"),
  asyncHandler(etudiantsController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(etudiantsController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(etudiantsController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(etudiantsController.remove)
);

module.exports = router;