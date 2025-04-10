// src/controllers/authController.js
const authService = require('../services/authService');
const userService = require('../services/userService');

const login = async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp thông tin đăng nhập và mật khẩu'
        });
    }

    try {
        // Kiểm tra thông tin đăng nhập
        let user = null;
        
        // Kiểm tra đăng nhập bằng username
        user = await userService.getUserByUsername(usernameOrEmail);
        
        // Nếu không tìm thấy user bằng username, thử tìm bằng email
        if (!user) {
            user = await userService.getUserByEmail(usernameOrEmail);
        }
        
        // Nếu không tìm thấy user
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Thông tin đăng nhập không đúng'
            });
        }
        
        // Kiểm tra xem tài khoản có bị khóa không
        if (user.is_locked) {
            return res.status(403).json({
                status: 'error',
                message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên'
            });
        }
        
        // Kiểm tra xem tài khoản đã được xác minh chưa
        if (!user.is_verified) {
            return res.status(403).json({
                status: 'error',
                message: 'Tài khoản chưa được xác minh. Vui lòng xác minh tài khoản',
                userId: user.id,
                email: user.email
            });
        }
        
        // Tiếp tục quá trình đăng nhập
        const { token, user: userData } = await authService.login(user.username, password);
        
        res.json({
            status: 'success',
            message: 'Đăng nhập thành công',
            data: { token, user: userData }
        });
    } catch (error) {
        // Nếu lỗi đăng nhập do mật khẩu không đúng
        if (error.message === 'Mật khẩu không đúng') {
            return res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
        
        // Nếu lỗi đăng nhập do tài khoản bị khóa
        if (error.message.includes('Tài khoản của bạn đã bị khóa')) {
            return res.status(403).json({
                status: 'error',
                message: error.message
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi đăng nhập'
        });
    }
};

module.exports = { login };