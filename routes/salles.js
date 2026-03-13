const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validationMiddleware");
const { requireAuth } = require("../middleware/authMiddleware");

const controller = require("../controllers/sallesController");

router.get("/", asyncHandler(controller.getAll));
router.get("/:id", asyncHandler(controller.getById));

router.post("/", requireAuth, validate(["nom", "capacite", "type"]), asyncHandler(controller.create));
router.put("/:id", requireAuth, asyncHandler(controller.update));
router.delete("/:id", requireAuth, asyncHandler(controller.remove));

router.get("/:id/maintenance", asyncHandler(controller.getMaintenance));
router.post("/:id/maintenance", requireAuth, validate(["date_debut", "date_fin"]), asyncHandler(controller.addMaintenance));

module.exports = router;