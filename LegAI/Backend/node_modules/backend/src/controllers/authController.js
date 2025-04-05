// src/controllers/authController.js
const authService = require('../services/authService');

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp username và password'
        });
    }

    try {
        const { token, user } = await authService.login(username, password);
        res.json({
            status: 'success',
            message: 'Đăng nhập thành công',
            data: { token, user }
        });
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = { login };