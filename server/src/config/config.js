// Configuration loader.
// Reads environment variables (populated from .env via Node's --env-file flag
// in the dev/start scripts) and falls back to sensible defaults for local
// development. In test environments the defaults are used; database-backed tests
// provide their own in-memory MongoDB URI and do not rely on MONGO_URI.
export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/startupfund',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
