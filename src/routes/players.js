const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'player-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

router.get('/', playerController.getAllPlayers);
router.get('/:id', playerController.getPlayerById);
router.post('/', upload.single('foto'), playerController.createPlayer);
router.put('/:id', upload.single('foto'), playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

module.exports = router;
