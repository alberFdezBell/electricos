const express = require('express');
const router = express.Router();
const posterController = require('../controllers/posterController');

router.get('/plantillas', posterController.getTemplates);

module.exports = router;
