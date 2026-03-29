const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const predictController = require('../controllers/predictController');
const authController = require('../controllers/authController');
const historyController = require('../controllers/historyController');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.put('/auth/profile/:id', authController.updateProfile);

// Interview & History Routes
router.post('/predict', upload.single('file'), predictController.processPrediction);
router.get('/history', historyController.getAllHistory);
router.delete('/history/:id', historyController.deleteHistory);
router.post('/history/save', historyController.saveHistory); // RUTE PENTING UNTUK SIMPAN RINGKASAN

module.exports = router;