const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const controller = require("../controllers/notificationsController");

const { authorizeRoles } = authMiddleware;

router.get("/", authMiddleware, asyncHandler(controller.getAll));
router.get("/:id", authMiddleware, asyncHandler(controller.getById));

router.post(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  validate(["role", "titre", "message"]),
  asyncHandler(controller.create)
);

router.patch("/:id/read", authMiddleware, asyncHandler(controller.markAsRead));

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(controller.remove)
);

module.exports = router;