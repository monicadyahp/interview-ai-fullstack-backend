import "dotenv/config";

const requireEnv = (key) => {
  const value = process.env[key]?.trim();
  if (!value)
    throw new Error(`Environment variable "${key}" is required but not set`);
  return value;
};

const buildMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT || "27017";
  const name = process.env.DB_NAME || "DBIntersight";
  const user = process.env.DB_USER?.trim();
  const pass = process.env.DB_PASSWORD?.trim();

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${name}?authSource=admin`;
  }
  return `mongodb://${host}:${port}/${name}`;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3005", 10),
  HOST: process.env.HOST || "127.0.0.1",
  APP_URL: process.env.APP_URL || "http://127.0.0.1:3005",
  FRONTEND_URL: process.env.APP_FRONTEND_URL || "http://localhost:5173",

  MONGO_URI: buildMongoUri(),

  SECRET_KEY: requireEnv("SECRET_KEY"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  EMOTION_API: {
    baseUrl: process.env.BASE_URL_API || "",
    apiKey: process.env.EMOTION_API_KEY || "",
  },

  OAUTH: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    // facebookAppId: process.env.FACEBOOK_APP_ID || "",
    // facebookAppSecret: process.env.FACEBOOK_APP_SECRET || "",
    // appleClientId: process.env.APPLE_CLIENT_ID || "",
    // appleTeamId: process.env.APPLE_TEAM_ID || "",
    // appleKeyId: process.env.APPLE_KEY_ID || "",
    // applePrivateKey: process.env.APPLE_PRIVATE_KEY || "",
  },
};

export default env;
