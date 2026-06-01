import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const sign = (payload, options = {}) =>
  jwt.sign(payload, env.SECRET_KEY, { expiresIn: env.JWT_EXPIRES_IN, ...options });

const verify = (token) => jwt.verify(token, env.SECRET_KEY);

export default { sign, verify };
