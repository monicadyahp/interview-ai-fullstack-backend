require('dotenv').config();

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const url = process.env.DB_URL || '127.0.0.1:27017';
  const name = process.env.DB_NAME || 'DBIntersight';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (user && password) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${url}/${name}?authSource=admin`;
  }
  return `mongodb://${url}/${name}`;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3005', 10),
  HOST: process.env.HOST || '127.0.0.1',
  APP_URL: process.env.APP_URL || 'http://127.0.0.1:3005',

  MONGO_URI: buildMongoUri(),

  SECRET_KEY: requireEnv('SECRET_KEY'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  EMOTION_API: {
    baseUrl: process.env.BASE_URL_API || 'https://zahwannisa-emotion-detection-api.hf.space',
    apiKey: process.env.EMOTION_API_KEY || '',
  },
};

module.exports = env;
