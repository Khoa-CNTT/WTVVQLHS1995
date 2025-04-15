const jwt = require('jsonwebtoken');

// Middleware bảo vệ routes cần xác thực
const protect = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Không có token, không được phép truy cập'
        });
    }

    // Sử dụng biến JWT_SECRET có giá trị mặc định để tránh lỗi
    const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'error',
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

// Middleware kiểm tra quyền của user
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Không có thông tin người dùng, không được phép truy cập'
            });
        }

        // Chuyển đổi role người dùng thành chữ thường để kiểm tra
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        
        // Kiểm tra xem role của người dùng có nằm trong danh sách roles được phép không
        // bằng cách chuyển cả hai về chữ thường
        const hasRole = roles.some(role => role.toLowerCase() === userRole);
        
        if (!hasRole) {
            console.log(`User với role "${req.user.role}" không có quyền thực hiện hành động yêu cầu role: ${roles.join(', ')}`);
            return res.status(403).json({
                status: 'error',
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }
        
        next();
    };
};

module.exports = { protect, authorize }; 