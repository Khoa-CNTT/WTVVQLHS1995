require('dotenv').config();
const { Pool } = require('pg');

// Tạo các giá trị mặc định nếu không có biến môi trường
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'legai',
    port: process.env.DB_PORT || 5432,
};

console.log('Cấu hình Database:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    // không log mật khẩu vì lý do bảo mật
});

const pool = new Pool(dbConfig);

pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối database:', err.stack);
        return;
    }
    console.log('Kết nối database thành công!');
    release();
});

module.exports = pool;