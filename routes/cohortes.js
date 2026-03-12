const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const { requireAuth } = require("../middleware/authMiddleware");

const controller = require("../controllers/cohortesController");

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getById));

router.post("/", requireAuth, validate(["nom", "annee", "effectif"]), asyncHandler(controller.create));
router.put("/:id", requireAuth, asyncHandler(controller.update));
router.delete("/:id", requireAuth, asyncHandler(controller.remove));

module.exports = router;