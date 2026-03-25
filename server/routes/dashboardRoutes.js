const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/dashboardController");

router.get("/stats", authMiddleware, asyncHandler(controller.getStats));
router.get("/occupation-salles", authMiddleware, asyncHandler(controller.getOccupationSalles));
router.get("/top-cohortes", authMiddleware, asyncHandler(controller.getTopCohortes));

module.exports = router;