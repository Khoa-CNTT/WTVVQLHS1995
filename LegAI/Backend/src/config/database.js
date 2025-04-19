require('dotenv').config();
const { dbConfig } = require('./env');
const { Pool } = require('pg');

// Cấu hình kết nối database từ file env.js
const pool = new Pool({
    host: dbConfig.DB_HOST,
    user: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    database: dbConfig.DB_NAME,
    port: dbConfig.DB_PORT,
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối database:', err.stack);
        return;
    }
    console.log('Kết nối database thành công!');
    release();
});

module.exports = pool;