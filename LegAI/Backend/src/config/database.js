require('dotenv').config();
const { Pool } = require('pg');


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