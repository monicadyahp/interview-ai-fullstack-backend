import asyncHandler from '../../../utils/asyncHandler.js';
import predictService from '../service/PredictService.js';

export const predict = asyncHandler(async (req, res) => {
  const result = await predictService.predictEmotion(req.file);
  res.status(200).json({ message: 'Prediksi emosi berhasil', data: result });
});

export const health = asyncHandler(async (req, res) => {
  const result = await predictService.healthCheck();
  res.status(200).json({ message: 'Layanan emotion detection aktif', data: result });
});
