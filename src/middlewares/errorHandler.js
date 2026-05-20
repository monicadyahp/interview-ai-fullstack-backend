import ApiError from '../utils/ApiError.js';
import ClientError from '../exceptions/client-error.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ClientError hierarchy (NotFoundError, InvariantError, AuthenticationError, AuthorizationError)
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({ status: 'fail', message: err.message });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // JSON body parse error dari body-parser
  if (err instanceof SyntaxError || err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'fail',
      message: 'Format JSON tidak valid. Pastikan semua key dan nilai string dibungkus tanda kutip (")',
    });
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Data tidak valid',
      errors: Object.values(err.errors || {}).map((e) => ({ path: e.path, message: e.message })),
    });
  }

  // Mongoose duplicate key
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `${field} sudah terdaftar` });
  }

  // Multer file size limit
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
