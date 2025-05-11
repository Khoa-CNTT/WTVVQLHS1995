// src/services/authService.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('./userService');

// Số lần đăng nhập thất bại tối đa trước khi khóa tài khoản
const MAX_FAILED_ATTEMPTS = 5;

// JWT Secret
const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';

// Cache để lưu OTP
const otpStorage = new Map();

const login = async (usernameOrEmail, password) => {
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
            throw new Error('Thông tin đăng nhập không đúng');
        }

        // Kiểm tra xem tài khoản có bị khóa không
        if (user.is_locked) {
            return {
                isLocked: true,
                message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên'
            };
        }

        // Kiểm tra xem tài khoản đã được xác minh chưa
        if (!user.is_verified) {
            return {
                needVerification: true,
                userId: user.id,
                email: user.email,
                username: user.username,
                message: 'Tài khoản chưa được xác minh. Vui lòng xác minh tài khoản'
            };
        }
        
        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            // Kiểm tra nếu là tài khoản admin thì không khóa
            const isAdmin = user.role && user.role.toLowerCase() === 'admin';
            
            if (!isAdmin) {
                // Chỉ tăng số lần đăng nhập thất bại nếu không phải admin
                await userService.updateFailedLoginAttempts(user.id);
                
                // Kiểm tra và khóa tài khoản nếu đăng nhập sai quá nhiều lần
                const updatedUser = await userService.getUserById(user.id);
                
                if (updatedUser.failed_attempts >= MAX_FAILED_ATTEMPTS) {
                    await userService.toggleUserLock(user.id);
                    throw new Error('Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần');
                }
            }
            
            throw new Error('Mật khẩu không đúng');
        }

        // Reset số lần đăng nhập thất bại
        await userService.resetFailedLoginAttempts(user.id);

        // Cập nhật thời gian đăng nhập cuối
        await userService.updateLastLogin(user.id);

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
        );

        // Tạo user object để trả về (bỏ password)
        const userToReturn = {
                id: user.id, 
                username: user.username,
                email: user.email,
            phone: user.phone,
                fullName: user.full_name,
                role: user.role,
                isVerified: user.is_verified,
                createdAt: user.created_at,
            lastLogin: user.last_login
        };
        
        return {
            token,
            user: userToReturn
        };
    } catch (error) {
        throw error;
    }
};

// Tạo mã OTP và lưu
const generateAndStoreOTP = (userId, email, username) => {
  try {
    // Tạo OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Thời gian hết hạn OTP (15 phút)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Lưu OTP vào bộ nhớ (key = userId)
    otpStorage.set(userId.toString(), {
      otp,
      email,
      username,
      expiresAt,
      attempts: 0
    });
    
    return { otp, expiresAt };
  } catch (error) {
    throw new Error(`Lỗi tạo OTP: ${error.message}`);
    }
};

// Export các functions
module.exports = { 
  login, 
  generateAndStoreOTP 
};