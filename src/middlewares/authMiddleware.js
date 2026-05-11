const jwtUtil = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Token autentikasi tidak ditemukan'));
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next(ApiError.unauthorized('Token autentikasi kosong'));
  }

  try {
    const decoded = jwtUtil.verify(token);
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token sudah kedaluwarsa'));
    }
    return next(ApiError.unauthorized('Token tidak valid'));
  }
};

module.exports = authMiddleware;
