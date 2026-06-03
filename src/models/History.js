const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Ubah ke String agar ID Google bisa masuk
    emotion: { type: String, required: true },
    motivation: { type: String, required: true },
    confidence: { type: Number },
    allStats: [
        { label: String, value: Number }
    ],
    question: { type: String },
    duration: { type: Number },
    answer: { type: String },
    // Posisi yang dilamar (diisi user di halaman Interview) + feedback sesi
    positionApplied: { type: String },
    feedbackNote: { type: String },
    feedbackScore: { type: Number },
    // --- FIELD BARU UNTUK FOTO ---
    userPhoto: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);