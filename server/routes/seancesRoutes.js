const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const controller = require("../controllers/reservationsController");

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  authMiddleware,
  validate(["salle_id", "seance_id"]),
  asyncHandler(controller.create)
);

router.put("/:id", authMiddleware, asyncHandler(controller.update));
router.patch("/:id/cancel", authMiddleware, asyncHandler(controller.cancel));

module.exports = router;