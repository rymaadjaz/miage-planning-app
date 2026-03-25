const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.get("/", authMiddleware, asyncHandler(userController.getUsers));

module.exports = router;