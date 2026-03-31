const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const predictController = require('../controllers/predictController');
const authController = require('../controllers/authController');
const historyController = require('../controllers/historyController');

const axios = require('axios');

router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    // Panggil URL Hugging Face kamu (Ganti linknya dengan link Direct URL kamu)
    const response = await axios.post('https://monicadyp-interview-ai-chatbot.hf.space/predict', {
      message: message
    });

    res.json({ 
      reply: response.data.response,
      tag: response.data.tag 
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ error: "Layanan AI sedang sibuk." });
  }
});

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