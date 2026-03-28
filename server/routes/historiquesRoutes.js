const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const historiquesController = require("../controllers/historiquesController");

const { authorizeRoles } = authMiddleware;

router.get(
  "/",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(historiquesController.getAll)
);

router.get(
  "/search/entity",
  authMiddleware,
  authorizeRoles("administratif"),
  asyncHandler(historiquesController.getByEntity)
);

module.exports = router;