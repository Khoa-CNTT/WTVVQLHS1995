require('dotenv').config();

// Cấu hình email
const emailConfig = {
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: process.env.MAIL_PORT || 587,
  MAIL_USER: process.env.MAIL_USER || 'phapluatlegai@gmail.com',
  MAIL_PASS: process.env.MAIL_PASS || 'ysyxpiiabzsjiqxr',
  MAIL_FROM: process.env.MAIL_FROM || 'LegAI <phapluatlegai@gmail.com>'
};

// Cấu hình database
const dbConfig = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '123456',
  DB_NAME: process.env.DB_NAME || 'legai'
};

// Cấu hình chung
const appConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8000,
  JWT_SECRET: process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

module.exports = {
  emailConfig,
  dbConfig,
  appConfig
};
