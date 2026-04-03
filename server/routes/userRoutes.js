const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/me",
  authMiddleware,
  asyncHandler(userController.getMe)
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(userController.getAll)
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(userController.getById)
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(userController.create)
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(userController.update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(userController.remove)
);

module.exports = router;