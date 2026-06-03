const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const predictController = require("../controllers/predictController");
const chatbotController = require("../controllers/chatbotController");
const historyController = require("../controllers/historyController");

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleLogin);
router.put("/auth/profile/:id", authController.updateProfile);

// Emotion Prediction Route — frontend → backend → Hugging Face predict API
router.post("/predict", predictController.processPrediction);

// Chatbot Route — frontend → backend → Hugging Face chat API
router.post("/chatbot", chatbotController.chat);

// History Routes
router.get("/history", historyController.getAllHistory);
router.delete("/history/:id", historyController.deleteHistory);
router.post("/history/save", historyController.saveHistory);

module.exports = router;
