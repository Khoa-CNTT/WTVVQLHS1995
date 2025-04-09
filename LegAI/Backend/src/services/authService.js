// src/services/authService.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
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

        // Không kiểm tra xác minh ở đây, vì đã kiểm tra ở controller
        
        // So sánh mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Mật khẩu không đúng');
        }

        // Cập nhật thời gian đăng nhập
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { 
            token, 
            user: { 
                id: user.id, 
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                isVerified: user.is_verified,
                lastLogin: user.last_login
            } 
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { login };