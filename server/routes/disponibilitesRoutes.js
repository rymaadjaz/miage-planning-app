const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const controller = require("../controllers/disponibilitesController");

router.get("/", asyncHandler(controller.getAll));
router.get("/enseignant/:enseignantId", asyncHandler(controller.getByEnseignant));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  authMiddleware,
  validate(["enseignant_id", "jour", "heureDebut", "heureFin"]),
  asyncHandler(controller.create)
);

router.put("/:id", authMiddleware, asyncHandler(controller.update));
router.delete("/:id", authMiddleware, asyncHandler(controller.remove));

module.exports = router;