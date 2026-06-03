const axios = require("axios");

exports.processPrediction = async (req, res) => {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) {
      return res
        .status(400)
        .json({ message: "image_base64 tidak ditemukan dalam body" });
    }

    const aiResponse = await axios.post(
      `${process.env.FAST_API_URL}/predict`,
      { image_base64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.EMOTION_API_KEY,
        },
      },
    );

    res.json(aiResponse.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 400)
      return res
        .status(400)
        .json({ message: "Payload tidak valid atau base64 rusak" });
    if (status === 401)
      return res
        .status(401)
        .json({ message: "API key tidak valid atau tidak dikirim" });
    if (status === 429)
      return res.status(429).json({
        message: "Terlalu banyak request, perlambat pengiriman frame",
      });
    console.error("Predict Error:", error.message);
    res.status(500).json({ message: "Gagal memproses prediksi AI, coba lagi" });
  }
};
