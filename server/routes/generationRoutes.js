const express = require('express');
const router = express.Router();
const generationController = require('../controllers/generationController');

router.post('/generer', generationController.genererEDTGlouton);

module.exports = router;