const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const lineupController = require('../controllers/lineupController');
const liveController = require('../controllers/liveController');

router.get('/', matchController.getAllMatches);
router.get('/top-stats', matchController.getTopStats);
router.get('/en-directo/activo', liveController.getActiveLiveMatch);
router.get('/:id', matchController.getMatchById);
router.post('/', matchController.createMatch);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

router.post('/:id/convocatoria', lineupController.saveConvocatoria);
router.post('/:id/alineacion', lineupController.saveAlineacion);

router.post('/:id/estado', liveController.updateLiveStatus);
router.post('/:id/eventos', liveController.addLiveEvent);
router.delete('/:id/eventos/:eventId', liveController.deleteLiveEvent);
router.post('/:id/reiniciar', liveController.resetMatch);

module.exports = router;


