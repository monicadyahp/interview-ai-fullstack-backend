const axios = require("axios");

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res
      .status(400)
      .json({ message: "Field 'message' tidak ditemukan dalam body" });
  }

  try {
    const aiResponse = await axios.post(
      `${process.env.FAST_API_URL}/chat`,
      { message },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.EMOTION_API_KEY,
        },
        timeout: 60000,
      },
    );

    const reply = aiResponse.data?.reply;

    if (!reply) {
      console.error(
        "Chatbot: unexpected response shape:",
        JSON.stringify(aiResponse.data),
      );
      return res.status(500).json({
        message: "Model tidak memberikan respons. Silakan coba lagi.",
      });
    }

    res.json({ reply });
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("Chatbot Error:", status, data || error.message);

    if (status === 400)
      return res.status(400).json({ message: "Payload JSON salah format." });
    if (status === 401)
      return res
        .status(401)
        .json({ message: "API key tidak valid atau tidak dikirim." });
    if (status === 422)
      return res.status(422).json({ message: "Format data tidak sesuai." });
    if (error.code === "ECONNABORTED")
      return res.status(500).json({
        message:
          "Request timeout. Model mungkin sedang loading, coba lagi dalam beberapa detik.",
      });

    res.status(500).json({
      message: "Maaf, asisten sedang sibuk. Silakan coba beberapa saat lagi.",
    });
  }
};
