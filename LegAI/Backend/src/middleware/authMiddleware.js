// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Không có token'
        });
    }

    // Sử dụng biến JWT_SECRET có giá trị mặc định để tránh lỗi
    const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: 'error',
                message: 'Token không hợp lệ'
            });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };