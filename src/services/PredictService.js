const env = require('../config/env');
const ApiError = require('../utils/ApiError');

class PredictService {
  constructor() {
    this.baseUrl = env.EMOTION_API.baseUrl;
    this.apiKey = env.EMOTION_API.apiKey;
  }

  _ensureConfigured() {
    if (!this.apiKey) {
      throw ApiError.internal('Emotion API key belum dikonfigurasi pada server');
    }
  }

  async predictEmotion(file) {
    if (!file || !file.buffer) {
      throw ApiError.badRequest('File gambar wajib diunggah pada field "file"');
    }
    this._ensureConfigured();

    const form = new FormData();
    const blob = new Blob([file.buffer], {
      type: file.mimetype || 'application/octet-stream',
    });
    form.append('file', blob, file.originalname || 'frame.jpg');

    let response;
    try {
      response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'X-API-KEY': this.apiKey },
        body: form,
      });
    } catch (err) {
      throw new ApiError(503, 'Gagal menghubungi layanan emotion detection');
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 401) {
        throw ApiError.internal('Emotion API key tidak valid');
      }
      if (response.status === 400) {
        throw ApiError.badRequest(`File tidak valid: ${text || 'bad request'}`);
      }
      throw new ApiError(response.status, `Layanan emotion detection error: ${text || response.statusText}`);
    }

    const data = await response.json();
    return this._enrichResult(data);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) {
        throw new ApiError(res.status, 'Health check gagal');
      }
      return await res.json();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, 'Layanan emotion detection tidak dapat dijangkau');
    }
  }

  _enrichResult(data) {
    const confidence = typeof data.confidence === 'number' ? data.confidence : null;
    return {
      predictedClass: data.predicted_class ?? null,
      confidence,
      confidencePercent:
        confidence !== null ? Number((confidence * 100).toFixed(2)) : null,
      meetsConfidenceThreshold: Boolean(data.meets_confidence_threshold),
      scores: Array.isArray(data.scores) ? data.scores : [],
      suggestion: data.suggestion ?? null,
      raw: data,
    };
  }
}

module.exports = new PredictService();
