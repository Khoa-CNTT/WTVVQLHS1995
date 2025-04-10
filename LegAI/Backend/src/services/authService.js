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

        // Kiểm tra xem tài khoản có bị khóa không
        if (user.is_locked) {
            throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
        }

        // Không kiểm tra xác minh ở đây, vì đã kiểm tra ở controller
        
        // So sánh mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            // Tăng số lần đăng nhập thất bại
            const updatedFailedAttempts = user.failed_attempts + 1;
            
            // Nếu số lần đăng nhập thất bại vượt quá 5 lần, khóa tài khoản
            let isLocked = user.is_locked;
            if (updatedFailedAttempts >= 5) {
                isLocked = true;
            }
            
            // Cập nhật số lần đăng nhập thất bại và trạng thái khóa
            await pool.query(
                'UPDATE users SET failed_attempts = $1, is_locked = $2 WHERE id = $3',
                [updatedFailedAttempts, isLocked, user.id]
            );
            
            if (updatedFailedAttempts >= 5) {
                throw new Error('Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá nhiều lần');
            }
            
            throw new Error('Mật khẩu không đúng');
        }

        // Đăng nhập thành công, đặt lại số lần đăng nhập thất bại
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_attempts = 0 WHERE id = $1',
            [user.id]
        );

        // Xác định JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';
        
        if (!jwtSecret) {
            throw new Error('JWT Secret không được thiết lập');
        }

        // Tạo JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            jwtSecret,
            { expiresIn: '1h' }
        );

        return { 
            token, 
            user: { 
                id: user.id, 
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                role: user.role,
                isVerified: user.is_verified,
                lastLogin: user.last_login,
                isLocked: user.is_locked,
                failedAttempts: user.failed_attempts,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            } 
        };
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        throw new Error(error.message);
    }
};

module.exports = { login };