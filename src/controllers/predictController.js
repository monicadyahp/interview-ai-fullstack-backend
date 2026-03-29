const axios = require('axios');
const FormData = require('form-data');

exports.processPrediction = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "File tidak ditemukan" });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'frame.jpg' });

        // Tembak ke FastAPI (Python)
        const aiResponse = await axios.post(`${process.env.FASTAPI_URL}/predict`, formData, {
            headers: { ...formData.getHeaders() }
        });

        // Kirim hasil AI ke Frontend (React)
        res.json(aiResponse.data); 
    } catch (error) {
        console.error("Predict Error:", error.message);
        res.status(500).json({ message: "Gagal memproses prediksi AI" });
    }
};