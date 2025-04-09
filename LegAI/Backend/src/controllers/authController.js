// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const pool = require('../config/database');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userQuery = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Tên người dùng không tồn tại' });
        }

        if (user.is_verified === false) {
            return res.status(400).json({ message: 'Tài khoản chưa được xác minh. Vui lòng xác minh tài khoản' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng' });
        }

        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { login };
