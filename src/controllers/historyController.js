const History = require('../models/History');

// backend > controllers > historyController.js

exports.saveHistory = async (req, res) => {
    try {
        // PERBAIKAN: Tambahkan 'userPhoto' di daftar ini agar bisa terbaca dari frontend
        const { userId, emotion, motivation, confidence, allStats, question, duration, answer, userPhoto } = req.body;
        
        const newHistory = new History({
            userId,
            emotion,
            motivation,
            confidence,
            allStats,
            question, 
            duration, 
            answer, 
            userPhoto // Sekarang ini sudah berisi data foto
        });

        await newHistory.save();
        res.status(201).json(newHistory);
    } catch (error) {
        console.error("Save History Error:", error);
        res.status(500).json({ message: "Gagal menyimpan riwayat" });
    }
};

// Ambil history (getAllHistory) dan hapus (deleteHistory) tetap sama kodenya
exports.getAllHistory = async (req, res) => {
    try {
        const { userId } = req.query; 
        if (!userId || userId === "undefined") return res.json([]);
        const data = await History.find({ userId }).sort({ createdAt: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).send("Server Error");
    }
};

exports.deleteHistory = async (req, res) => {
    try {
        await History.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Riwayat dihapus' });
    } catch (error) {
        res.status(500).send("Server Error");
    }
};