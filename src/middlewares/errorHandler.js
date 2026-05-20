import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Data tidak valid',
      errors: Object.values(err.errors || {}).map((e) => ({ path: e.path, message: e.message })),
    });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `${field} sudah terdaftar` });
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Ukuran file terlalu besar (maks 5MB)' });
  }

  console.error('[error]', err);
  res.status(500).json({
    message: 'Internal Server Error',
    ...(env.NODE_ENV !== 'production' ? { detail: err.message } : {}),
  });
};

export default errorHandler;
