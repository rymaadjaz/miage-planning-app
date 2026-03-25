const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/etudiantsController");

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  authMiddleware,
  validate(["id", "numeroEtudiant"]),
  asyncHandler(controller.create)
);

router.put("/:id", authMiddleware, asyncHandler(controller.update));
router.delete("/:id", authMiddleware, asyncHandler(controller.remove));

module.exports = router;