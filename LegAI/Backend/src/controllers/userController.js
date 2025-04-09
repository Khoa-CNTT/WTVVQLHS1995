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

// Lấy danh sách người dùng
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';
        const role = req.query.role || '';

        const result = await userService.getUsers(page, limit, searchTerm, role);
        
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

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

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    const userId = req.params.userId;
    const userData = req.body;

    try {
        // Kiểm tra ID người dùng
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                status: 'error',
                message: 'ID người dùng không hợp lệ hoặc không tồn tại'
            });
        }

        // Kiểm tra dữ liệu trước khi cập nhật
        if (!userData.fullName) {
            return res.status(400).json({
                status: 'error',
                message: 'Họ tên không được để trống'
            });
        }

        // Chuẩn bị dữ liệu đúng format cho userService
        const updateData = {
            fullName: userData.fullName,
            phone: userData.phone || '', // Đảm bảo không bị null
            role: userData.role,
            address: userData.address || '', // Đảm bảo không bị null
            bio: userData.bio || ''  // Đảm bảo không bị null
        };

        const updatedUser = await userService.updateUser(userId, updateData);
        
        res.json({
            status: 'success',
            message: 'Cập nhật thông tin thành công',
            data: updatedUser
        });
    } catch (error) {
        console.error('Lỗi cập nhật người dùng:', error);
        res.status(500).json({
            status: 'error',
            message: `Lỗi cập nhật: ${error.message}`
        });
    }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Kiểm tra ID người dùng
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                status: 'error',
                message: 'ID người dùng không hợp lệ hoặc không tồn tại'
            });
        }

        // Admin chính không thể bị xóa
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                status: 'error',
                message: 'Không thể xóa tài khoản admin chính'
            });
        }

        const result = await userService.deleteUser(userId);
        
        res.json({
            status: 'success',
            message: 'Xóa tài khoản thành công',
            data: result
        });
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);
        res.status(500).json({
            status: 'error',
            message: `Lỗi xóa: ${error.message}`
        });
    }
};

// Khóa/mở khóa tài khoản
const toggleUserLock = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Kiểm tra ID người dùng
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                status: 'error',
                message: 'ID người dùng không hợp lệ hoặc không tồn tại'
            });
        }

        const user = await userService.toggleUserLock(userId);
        
        res.json({
            status: 'success',
            message: `Tài khoản đã được ${user.is_locked ? 'khóa' : 'mở khóa'}`,
            data: user
        });
    } catch (error) {
        console.error('Lỗi khóa/mở khóa người dùng:', error);
        res.status(500).json({
            status: 'error',
            message: `Lỗi: ${error.message}`
        });
    }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    const userId = req.params.userId;
    const { newPassword } = req.body;

    try {
        // Kiểm tra ID người dùng
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                status: 'error',
                message: 'ID người dùng không hợp lệ hoặc không tồn tại'
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng cung cấp mật khẩu mới'
            });
        }

        await userService.resetPassword(userId, newPassword);
        
        res.json({
            status: 'success',
            message: 'Đặt lại mật khẩu thành công'
        });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        res.status(500).json({
            status: 'error',
            message: `Lỗi: ${error.message}`
        });
    }
};

module.exports = {
    register,
    verifyAccount,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserLock,
    resetPassword
};

