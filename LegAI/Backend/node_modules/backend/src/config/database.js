require('dotenv').config();
const { Pool } = require('pg');

// Kiểm tra các biến môi trường
// const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
// requiredEnvVars.forEach((varName) => {
//     if (!process.env[varName]) {
//         throw new Error(`Thiếu biến môi trường: ${varName}`);
//     }
// });

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'legai',
    port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối database:', err.stack);
        return;
    }
    console.log('Kết nối database thành công!');
    release();
});

module.exports = pool;