// src/controllers/authController.js
const authService = require('../services/authService');
const userService = require('../services/userService');

const login = async (req, res) => {
    try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({
            status: 'error',
                message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu'
        });
    }

        const authResult = await authService.login(usernameOrEmail, password);
        
        // Nếu tài khoản chưa xác minh
        if (authResult.needVerification) {
            return res.status(403).json({
                status: 'error',
                message: 'Tài khoản chưa được xác minh. Vui lòng xác minh tài khoản để tiếp tục.',
                userId: authResult.userId,
                email: authResult.email,
                username: authResult.username,
                needVerification: true
            });
        }
        
        // Nếu tài khoản đã bị khóa
        if (authResult.isLocked) {
            return res.status(403).json({
                status: 'error',
                message: 'Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng liên hệ quản trị viên.',
                isLocked: true
            });
        }
        
        // Đăng nhập thành công
        return res.status(200).json({
            status: 'success',
            message: 'Đăng nhập thành công',
            data: {
                token: authResult.token,
                user: authResult.user
            }
        });
        
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi server khi đăng nhập'
        });
    }
};

module.exports = { login };