const asyncHandler = require('../utils/asyncHandler');
const predictService = require('../services/PredictService');

const predict = asyncHandler(async (req, res) => {
  const result = await predictService.predictEmotion(req.file);
  res.status(200).json({
    message: 'Prediksi emosi berhasil',
    data: result,
  });
});

const health = asyncHandler(async (req, res) => {
  const result = await predictService.healthCheck();
  res.status(200).json({
    message: 'Layanan emotion detection aktif',
    data: result,
  });
});

module.exports = { predict, health };
