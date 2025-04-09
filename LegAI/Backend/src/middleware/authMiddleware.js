// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Tạm thời bỏ qua xác thực token để test
    next();
    
    // Uncomment đoạn code dưới đây khi cần bật lại xác thực
    /*
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Không có token'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: 'error',
                message: 'Token không hợp lệ'
            });
        }
        req.user = user;
        next();
    });
    */
};

module.exports = { authenticateToken };