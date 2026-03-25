const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const controller = require("../controllers/conflitsController");

router.get("/", asyncHandler(controller.getAll));
router.get("/open", asyncHandler(controller.getOpen));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  authMiddleware,
  validate(["type", "description"]),
  asyncHandler(controller.create)
);

router.patch("/:id/resolve", authMiddleware, asyncHandler(controller.resolve));

module.exports = router;