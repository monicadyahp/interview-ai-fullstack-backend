const jwt = require('jsonwebtoken');
const env = require('../config/env');

const sign = (payload, options = {}) => {
  return jwt.sign(payload, env.SECRET_KEY, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
};

const verify = (token) => jwt.verify(token, env.SECRET_KEY);

module.exports = { sign, verify };
