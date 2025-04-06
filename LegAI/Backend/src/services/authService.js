// src/services/authService.js
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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