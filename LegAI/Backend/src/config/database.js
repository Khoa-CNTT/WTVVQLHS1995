const { Pool } = require('pg');

<<<<<<< HEAD
const pool = new Pool({
    host:'localhost',
    user:'postgres',
    password:'123456', 
    database:'postgres',
    port:5432,
=======
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
>>>>>>> main
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