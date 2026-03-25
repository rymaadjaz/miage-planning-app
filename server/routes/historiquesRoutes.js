const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");

const controller = require("../controllers/historiquesController");

router.get("/", authMiddleware, asyncHandler(controller.getAll));
router.get("/:entite/:entite_id", authMiddleware, asyncHandler(controller.getByEntity));

module.exports = router;