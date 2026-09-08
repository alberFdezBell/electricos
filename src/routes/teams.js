const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const teamController = require('../controllers/teamController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'team-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

router.get('/', teamController.getAllTeams);
router.post('/', upload.single('foto'), teamController.createTeam);
router.put('/:id', upload.single('foto'), teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
