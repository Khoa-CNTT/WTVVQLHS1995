const userService = require('../services/userService');
const authService = require('../services/authService');
// Không cần emailService nữa vì gửi email sẽ được xử lý ở frontend
// const emailService = require('../services/emailService');

// Đăng ký người dùng mới
const register = async (req, res) => {
    const { username, password, email, phone, fullName } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!username || !password || !email || !phone || !fullName) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp đầy đủ thông tin'
        });
    }

    try {
        // Kiểm tra username đã tồn tại chưa
        const userExists = await userService.checkUserExists(username, email);
        if (userExists) {
            return res.status(400).json({
                status: 'error',
                message: 'Tên đăng nhập hoặc email đã tồn tại'
            });
        }

        // Tạo người dùng mới (chưa xác minh)
        const user = await userService.createUser(username, password, email, phone, fullName);
        
        // Không tạo OTP ở backend nữa, việc này sẽ được xử lý ở frontend
        // const otpInfo = await authService.generateAndStoreOTP(user.id, email);
        
        // Không gửi email từ backend nữa
        // await emailService.sendVerificationEmail(email, user.username, otpInfo.otp);

        res.status(201).json({
            status: 'success',
            message: 'Đăng ký thành công, vui lòng xác minh tài khoản',
            data: { 
                userId: user.id,
                username: user.username,
                email: user.email 
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Xác minh tài khoản với OTP
const verifyAccount = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp userId'
        });
    }

    try {
        // OTP đã được xác minh ở frontend, chỉ cần cập nhật trạng thái người dùng
        await userService.verifyUser(userId);
        
        res.json({
            status: 'success',
            message: 'Xác minh tài khoản thành công'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Không cần resendOTP nữa vì việc gửi lại OTP sẽ được xử lý hoàn toàn ở frontend

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp userId'
        });
    }

    try {
        // Lấy thông tin người dùng
        const user = await userService.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = { register, verifyAccount, getUserById };

