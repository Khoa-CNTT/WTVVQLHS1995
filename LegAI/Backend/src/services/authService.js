// src/services/authService.js
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// chức năng đăng nhập 
const login = async (username, password) => {

    try {
        // Tìm user theo username
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (userQuery.rows.length === 0) {
            throw new Error('Tên đăng nhập không tồn tại');
        }

        const user = userQuery.rows[0];

        // So sánh mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Mật khẩu không đúng');
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { token, user: { id: user.id, username: user.username } };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { login };
// testLogin.js
//const { login } = require('./src/services/authService');

// Hàm test đăng nhập
async function testLogin() {
    try {
        // Test case 1: Đăng nhập với thông tin đúng
        console.log('Test 1: Đăng nhập với thông tin đúng');
        const result1 = await login('admin', 'Pass123@');
        console.log('Kết quả:', result1);
        console.log('đăng nhập thanhf công ');

        // Test case 2: Đăng nhập với username không tồn tại
        console.log('Test 2: Đăng nhập với username không tồn tại');
        try {
            await login('nonExistingUser', 'password123');
        } catch (error) {
            console.log('Lỗi như mong đợi:', error.message);
        }
        console.log('------------------------');

        // Test case 3: Đăng nhập với mật khẩu sai
        console.log('Test 3: Đăng nhập với mật khẩu sai');
        try {
            await login('admin', 'wrongPassword');
        } catch (error) {
            console.log('Lỗi như mong đợi:', error.message);
        }

    } catch (error) {
        console.error('Lỗi không mong đợi:', error.message);
    }
}

// Chạy test
testLogin();