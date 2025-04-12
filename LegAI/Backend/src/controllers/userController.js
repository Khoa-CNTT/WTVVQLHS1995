const userService = require('../services/userService');
const authService = require('../services/authService');
const bcryptjs = require('bcryptjs');
// Không cần emailService nữa vì gửi email sẽ được xử lý ở frontend
// const emailService = require('../services/emailService');

// Đăng ký người dùng mới
const register = async (req, res) => {
    const { username, password, email, phone, fullName, role } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!username || !password || !email || !phone || !fullName) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp đầy đủ thông tin'
        });
    }
    
    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
        return res.status(400).json({
            status: 'error',
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
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

        // Chuẩn hóa role với chữ cái đầu viết hoa
        let normalizedRole = 'User'; // Role mặc định là User
        if (role) {
            const roleToLower = role.toLowerCase();
            // Chỉ chấp nhận các role hợp lệ và viết hoa chữ cái đầu
            if (roleToLower === 'admin' || roleToLower === 'user' || roleToLower === 'lawyer') {
                normalizedRole = roleToLower.charAt(0).toUpperCase() + roleToLower.slice(1);
            }
        }

        // Tạo người dùng mới (chưa xác minh)
        const user = await userService.createUser(username, password, email, phone, fullName, normalizedRole);
        
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
                email: user.email,
                role: user.role
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

        // Xóa hoàn toàn người dùng khỏi database
        const result = await userService.deleteUser(userId);
        
        res.json({
            status: 'success',
            message: 'Xóa tài khoản thành công',
            data: result
        });
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);
        
        // Cung cấp thông báo lỗi cụ thể cho các trường hợp lỗi khác nhau
        let errorMessage = error.message;
        let statusCode = 500;
        
        if (error.message.includes('violates foreign key constraint')) {
            statusCode = 409;
            errorMessage = 'Không thể xóa người dùng vì còn dữ liệu liên kết trong hệ thống. Hãy xóa dữ liệu liên quan trước.';
        } else if (error.message.includes('Không tìm thấy người dùng')) {
            statusCode = 404;
        }
        
        res.status(statusCode).json({
            status: 'error',
            message: errorMessage
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

// Lấy thống kê của người dùng theo ID
const getUserStats = async (req, res) => {
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
        
        // Mặc định trả về các thống kê cơ bản
        // Trong thực tế, bạn sẽ truy vấn cơ sở dữ liệu để lấy số liệu thực
        const stats = {
            documents: 0,  // Số lượng tài liệu
            cases: 0,      // Số lượng vụ án
            appointments: 0, // Số cuộc hẹn
            consultations: 0 // Số lần tư vấn
        };
        
        // TODO: Truy vấn thống kê thực tế từ cơ sở dữ liệu
        
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê người dùng:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp email'
        });
    }
    
    try {
        // Tìm người dùng với email cung cấp
        const user = await userService.getUserByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy tài khoản với email này'
            });
        }
        
        // Tạo mã OTP
        const { otp, expiresAt } = await userService.createPasswordResetToken(user.id, email);
        
        res.json({
            status: 'success',
            message: 'Mã OTP đã được tạo',
            data: {
                userId: user.id,
                email: user.email,
                otp: otp, // Trả về OTP để frontend gửi email
                fullName: user.full_name, // Thêm tên người dùng
                expiresAt
            }
        });
    } catch (error) {
        console.error('Lỗi quên mật khẩu:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi xử lý yêu cầu quên mật khẩu'
        });
    }
};

const verifyResetToken = async (req, res) => {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp userId và otp'
        });
    }
    
    try {
        // Xác minh mã OTP
        const isValid = await userService.verifyPasswordResetToken(userId, otp);
        
        if (!isValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }
        
        res.json({
            status: 'success',
            message: 'Mã OTP hợp lệ',
            data: {
                userId
            }
        });
    } catch (error) {
        console.error('Lỗi xác minh mã OTP:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi xử lý xác minh mã OTP'
        });
    }
};

const changePassword = async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp userId, currentPassword và newPassword'
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
        
        // Kiểm tra mật khẩu hiện tại
        const validPassword = await bcryptjs.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }
        
        // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        const isSamePassword = await bcryptjs.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
            });
        }
        
        // Đặt lại mật khẩu
        await userService.resetPassword(userId, newPassword);
        
        // Ghi log hành động
        // TODO: Thêm ghi log vào bảng AuditLogs
        
        res.json({
            status: 'success',
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi xử lý đổi mật khẩu'
        });
    }
};

// Kiểm tra ràng buộc database
const checkDatabaseConstraints = async (req, res) => {
    try {
        const { tableName } = req.params;
        const client = await pool.connect();
        
        // Truy vấn để lấy thông tin ràng buộc foreign key
        const query = `
            SELECT 
                tc.table_name AS table_name, 
                kcu.column_name AS column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' 
                AND (
                    ccu.table_name = $1 OR
                    tc.table_name = $1
                )
        `;
        
        const result = await client.query(query, [tableName]);
        client.release();
        
        res.json({
            status: 'success',
            data: result.rows
        });
    } catch (error) {
        console.error('Lỗi kiểm tra ràng buộc database:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
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
    resetPassword,
    forgotPassword,
    verifyResetToken,
    changePassword,
    getUserStats,
    checkDatabaseConstraints
};

