const axios = require("axios");

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Field 'message' tidak ditemukan dalam body" });
    }

    const aiResponse = await axios.post(
      `${process.env.FAST_API_URL}/chat`,
      { message },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.EMOTION_API_KEY,
        },
      }
    );

    res.json(aiResponse.data); // { reply: "..." }
  } catch (error) {
    const status = error.response?.status;
    if (status === 400) return res.status(400).json({ message: "Payload JSON salah format" });
    if (status === 401) return res.status(401).json({ message: "API key tidak valid atau tidak dikirim" });
    if (status === 422) return res.status(422).json({ message: "Format data tidak sesuai, pastikan field 'message' ada dan Content-Type benar" });
    console.error("Chatbot Error:", error.message);
    res.status(500).json({ message: "Maaf, asisten HRD sedang sibuk. Silakan coba beberapa saat lagi." });
  }
};
