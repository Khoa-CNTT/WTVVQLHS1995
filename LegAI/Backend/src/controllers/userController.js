const userService = require('../services/userService');
const authService = require('../services/authService');
const bcryptjs = require('bcryptjs');
const pool = require('../config/database');
// Không cần emailService nữa vì gửi email sẽ được xử lý ở frontend
// const emailService = require('../services/emailService');

// Tạo đường dẫn lưu file upload
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '../../uploads');

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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
        
        // Xử lý đặc biệt cho trường hợp quên mật khẩu
        const isPasswordResetFlow = currentPassword === "reset_password_placeholder";
        
        if (!isPasswordResetFlow) {
            // Kiểm tra mật khẩu hiện tại nếu không phải luồng đặt lại mật khẩu
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

// Đăng ký làm luật sư
const registerLawyer = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);
        console.log("Files nhận được:", req.files);
        
        // Lấy dữ liệu từ form
        const { 
            username, password, email, phone, fullName, 
            address, bio, 
            certification, experienceYears, specialization,
            idCard, birthDate, licenseNumber, barAssociation, lawOffice,
            userId // Thêm userId cho trường hợp người dùng đã đăng nhập
        } = req.body;
        
        // Hạn chế độ dài của các trường đầu vào để tránh lỗi varchar(50)
        const truncateField = (field, maxLength = 50) => {
            return field && typeof field === 'string' ? field.substring(0, maxLength) : field;
        };
        
        const truncatedSpecialization = truncateField(specialization);
        const truncatedCertification = truncateField(certification);
        const truncatedLicenseNumber = truncateField(licenseNumber);
        const truncatedBarAssociation = truncateField(barAssociation);
        const truncatedLawOffice = truncateField(lawOffice);
        
        // Kiểm tra xem có cung cấp userId của người dùng đã đăng nhập không
        if (userId) {
            console.log("Đăng ký luật sư cho người dùng đã đăng nhập, userId:", userId);
            
            // Kiểm tra các trường bắt buộc (khác với trường hợp đăng ký mới)
            if (!address || !licenseNumber || !barAssociation || !lawOffice || !idCard) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc (địa chỉ, số thẻ luật sư, đoàn luật sư, văn phòng luật và CCCD)'
                });
            }
            
            // Kiểm tra avatar và certificationFile
            if (!req.files || !req.files.avatar || !req.files.certificationFile) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng tải lên ảnh đại diện và ảnh thẻ luật sư'
                });
            }
            
            // Lấy thông tin người dùng hiện tại từ DB
            const existingUser = await userService.getUserById(userId);
            if (!existingUser) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Không tìm thấy người dùng với ID cung cấp'
                });
            }
            
            // Cập nhật vai trò người dùng thành "Lawyer" với chữ L viết hoa
            await pool.query(
                'UPDATE Users SET role = $1 WHERE id = $2 RETURNING *',
                ['Lawyer', userId]
            );
            
            // Tạo đường dẫn lưu file
            const avatarPath = req.files.avatar[0].path;
            const certificationPath = req.files.certificationFile[0].path;
            
            // Kiểm tra xem người dùng đã có profile chưa
            const existingProfile = await pool.query(
                'SELECT * FROM UserProfiles WHERE user_id = $1',
                [userId]
            );
            
            if (existingProfile.rows.length > 0) {
                // Cập nhật profile nếu đã tồn tại
                await pool.query(
                    'UPDATE UserProfiles SET address = $1, avatar_url = $2, bio = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
                    [truncateField(address), avatarPath, bio || '', userId]
                );
            } else {
                // Tạo profile mới nếu chưa tồn tại
                await pool.query(
                    'INSERT INTO UserProfiles (user_id, address, avatar_url, bio, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
                    [userId, truncateField(address), avatarPath, bio || '']
                );
            }
            
            // Chuẩn bị dữ liệu luật sư
            const lawyerData = {
                lawyer_id: userId,
                certification: truncatedCertification || truncatedLicenseNumber,
                experience_years: parseInt(experienceYears) || 0,
                specialization: truncatedSpecialization || '',
                rating: 0.0
            };
            
            // Kiểm tra xem đã có thông tin luật sư chưa
            const existingLawyerDetails = await pool.query(
                'SELECT * FROM LawyerDetails WHERE lawyer_id = $1',
                [userId]
            );
            
            if (existingLawyerDetails.rows.length > 0) {
                // Cập nhật thông tin luật sư nếu đã tồn tại
                await pool.query(
                    'UPDATE LawyerDetails SET certification = $1, experience_years = $2, specialization = $3 WHERE lawyer_id = $4',
                    [lawyerData.certification, lawyerData.experience_years, lawyerData.specialization, userId]
                );
            } else {
                // Thêm thông tin luật sư nếu chưa tồn tại
                await pool.query(
                    'INSERT INTO LawyerDetails (lawyer_id, certification, experience_years, specialization, rating, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
                    [lawyerData.lawyer_id, lawyerData.certification, lawyerData.experience_years, lawyerData.specialization, lawyerData.rating]
                );
            }
            
            return res.status(200).json({
                status: 'success',
                message: 'Đăng ký làm luật sư thành công. Hồ sơ của bạn đang được xem xét.',
                data: {
                    userId: userId,
                    role: 'Lawyer'
                }
            });
        } else {
            // Trường hợp đăng ký mới (không phải người dùng đã đăng nhập)
            // Kiểm tra các trường bắt buộc
            if (!username || !password || !email || !phone || !fullName || !address || !licenseNumber) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }

            // Kiểm tra avatar và certificationFile
            if (!req.files || !req.files.avatar || !req.files.certificationFile) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng tải lên ảnh đại diện và ảnh thẻ luật sư'
                });
            }

            // Kiểm tra xem username hoặc email đã tồn tại chưa
            const userExistsCheck = await userService.checkUserExists(username, email);
            if (userExistsCheck.exists) {
                return res.status(400).json({
                    status: 'error',
                    message: userExistsCheck.message
                });
            }

            // Tạo đường dẫn lưu file
            const avatarPath = req.files.avatar[0].path;
            const certificationPath = req.files.certificationFile[0].path;

            // Đăng ký người dùng với vai trò Lawyer
            const newUser = await userService.createUser(
                username, 
                password, 
                email, 
                phone, 
                fullName,
                'Lawyer' // Vai trò luật sư với chữ L viết hoa
            );

            // Lưu thông tin profile
            const userProfileData = {
                user_id: newUser.id,
                address: truncateField(address),
                avatar_url: avatarPath,
                bio: bio || ''
            };
            
            // Lưu thông tin profile vào database
            const userProfileResult = await pool.query(
                'INSERT INTO UserProfiles (user_id, address, avatar_url, bio, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
                [userProfileData.user_id, userProfileData.address, userProfileData.avatar_url, userProfileData.bio]
            );

            // Lưu thông tin luật sư
            const lawyerData = {
                lawyer_id: newUser.id,
                certification: truncatedCertification || truncatedLicenseNumber,
                experience_years: parseInt(experienceYears) || 0,
                specialization: truncatedSpecialization || '',
                rating: 0.0
            };
            
            // Lưu thông tin luật sư vào database
            const lawyerResult = await pool.query(
                'INSERT INTO LawyerDetails (lawyer_id, certification, experience_years, specialization, rating, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
                [lawyerData.lawyer_id, lawyerData.certification, lawyerData.experience_years, lawyerData.specialization, lawyerData.rating]
            );

            // Lưu thông tin bổ sung vào UserMeta (nếu cần thiết)
            if (idCard || birthDate || truncatedLicenseNumber || truncatedBarAssociation || truncatedLawOffice) {
                // Thêm bảng UserMeta nếu cần lưu thông tin bổ sung
                // ...
            }

            // Tạo OTP và gửi email xác minh
            await authService.generateAndStoreOTP(newUser.id, email, username);

            return res.status(201).json({
                status: 'success',
                message: 'Đăng ký làm luật sư thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
                data: {
                    userId: newUser.id,
                    email: newUser.email
                }
            });
        }
    } catch (error) {
        console.error('Lỗi đăng ký luật sư:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Lỗi server khi đăng ký luật sư'
        });
    }
};

// Lấy danh sách tất cả luật sư (có thể lọc và phân trang)
const getAllLawyers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';
        const specialization = req.query.specialization || '';

        // Xây dựng các tham số truy vấn
        const params = [];
        let query = `
            SELECT u.id, u.username, u.email, u.phone, u.full_name, u.role, u.is_verified,
                   up.address, up.bio, up.avatar_url,
                   COALESCE(ld.rating, 0) as rating, ld.specialization, ld.experience_years
            FROM users u
            LEFT JOIN userprofiles up ON u.id = up.user_id
            LEFT JOIN lawyerdetails ld ON u.id = ld.lawyer_id
            WHERE u.username NOT LIKE 'deleted_%'
            AND u.role ILIKE '%lawyer%'
        `;

        if (searchTerm) {
            params.push(`%${searchTerm}%`);
            query += ` AND (u.username ILIKE $${params.length} 
                OR u.email ILIKE $${params.length} 
                OR u.full_name ILIKE $${params.length})`;
        }

        if (specialization) {
            params.push(`%${specialization}%`);
            query += ` AND ld.specialization ILIKE $${params.length}`;
        }

        // Tổng số luật sư
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM (${query}) as count_query`,
            params
        );
        const totalLawyers = parseInt(countResult.rows[0].count);

        // Lấy danh sách luật sư với phân trang
        query += ` ORDER BY ld.rating DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, (page - 1) * limit);

        const result = await pool.query(query, params);

        // Trả về danh sách luật sư với thông tin cơ bản
        return res.status(200).json({
            success: true,
            data: {
                lawyers: result.rows.map(user => ({
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    avatar: user.avatar_url,
                    bio: user.bio,
                    address: user.address,
                    rating: parseFloat(user.rating) || 0,
                    specialization: user.specialization,
                    experienceYears: parseInt(user.experience_years) || 0,
                    role: user.role
                })),
                totalLawyers: totalLawyers,
                totalPages: Math.ceil(totalLawyers / limit),
                currentPage: page
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách luật sư:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách luật sư',
            error: error.message
        });
    }
};

// Lấy thông tin chi tiết của luật sư theo ID
const getLawyerById = async (req, res) => {
    try {
        const lawyerId = req.params.id;

        // Truy vấn kết hợp dữ liệu từ cả hai bảng Users và LawyerDetails
        // Sử dụng ILIKE thay vì = để không phân biệt chữ hoa/thường cho role
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.phone, 
                u.full_name,
                u.role, 
                u.is_verified,
                u.created_at,
                ld.certification, 
                ld.experience_years::integer as experience_years, 
                ld.specialization,
                ld.rating::numeric as rating,
                COALESCE(up.address, '') as address,
                COALESCE(up.bio, '') as bio,
                COALESCE(up.avatar_url, '') as avatar_url
            FROM 
                Users u
            JOIN 
                LawyerDetails ld ON u.id = ld.lawyer_id
            LEFT JOIN
                UserProfiles up ON u.id = up.user_id
            WHERE 
                u.id = $1 AND u.role ILIKE $2
        `;

        const result = await pool.query(query, [lawyerId, '%lawyer%']);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy luật sư'
            });
        }

        const lawyer = result.rows[0];
        
        // Đảm bảo experience_years là số nguyên
        lawyer.experience_years = lawyer.experience_years !== null ? parseInt(lawyer.experience_years) : 0;
        
        // Đảm bảo rating là số thập phân
        lawyer.rating = lawyer.rating !== null ? parseFloat(lawyer.rating) : 0;
        
        // Xử lý đường dẫn avatar
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let avatarUrl = '';
        
        if (lawyer.avatar_url) {
            // Kiểm tra xem avatar_url có phải là đường dẫn đầy đủ chưa
            if (lawyer.avatar_url.startsWith('http')) {
                avatarUrl = lawyer.avatar_url;
            } else if (lawyer.avatar_url.startsWith('/uploads/')) {
                avatarUrl = `${baseUrl}${lawyer.avatar_url}`;
            } else {
                avatarUrl = `${baseUrl}/uploads/${lawyer.avatar_url}`;
            }
        }

        // Định dạng kết quả trả về
        const response = {
            id: lawyer.id,
            username: lawyer.username,
            email: lawyer.email,
            phone: lawyer.phone,
            fullName: lawyer.full_name,
            role: lawyer.role,
            isVerified: lawyer.is_verified,
            createdAt: lawyer.created_at,
            certification: lawyer.certification,
            experienceYears: lawyer.experience_years,
            specialization: lawyer.specialization,
            rating: lawyer.rating,
            address: lawyer.address,
            bio: lawyer.bio,
            avatarUrl: avatarUrl
        };

        // Log để debug
        console.log('Chi tiết luật sư:', {
            id: lawyer.id,
            experienceYears: lawyer.experience_years,
            avatarUrl: avatarUrl
        });

        return res.status(200).json({
            status: 'success',
            data: response
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin luật sư:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi server khi lấy thông tin luật sư'
        });
    }
};

// Hàm để cập nhật avatar user
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        // Kiểm tra user có tồn tại không
        const userCheck = await pool.query('SELECT * FROM Users WHERE id = $1', [userId]);
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy người dùng'
            });
        }
        
        // Kiểm tra có file được upload không
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Không có file được upload'
            });
        }
        
        console.log('File đã upload:', req.file);
        
        // Tên file đã được lưu
        const avatarFilename = req.file.filename;
        
        // Đảm bảo url bắt đầu bằng slash
        const avatarUrl = `/uploads/${avatarFilename}`;
        
        // URL đầy đủ để trả về client
        const fullAvatarUrl = `${req.protocol}://${req.get('host')}${avatarUrl}`;
        
        // Kiểm tra xem user đã có profile chưa
        const profileCheck = await pool.query('SELECT * FROM UserProfiles WHERE user_id = $1', [userId]);
        
        let result;
        
        // Nếu đã có profile thì cập nhật, nếu chưa thì tạo mới
        if (profileCheck.rows.length > 0) {
            result = await pool.query(
                'UPDATE UserProfiles SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
                [avatarFilename, userId]
            );
        } else {
            result = await pool.query(
                'INSERT INTO UserProfiles (user_id, avatar_url, address, bio) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, avatarFilename, '', '']
            );
        }
        
        // Trả về thông tin đã cập nhật với URL đầy đủ
        return res.status(200).json({
            status: 'success',
            message: 'Avatar đã được cập nhật',
            data: {
                userId: userId,
                avatarUrl: avatarUrl,
                fullAvatarUrl: fullAvatarUrl,
                filename: avatarFilename
            }
        });
        
    } catch (error) {
        console.error('Lỗi khi upload avatar:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi server khi upload avatar'
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
    getUserStats,
    forgotPassword,
    verifyResetToken,
    changePassword,
    checkDatabaseConstraints,
    registerLawyer,
    getAllLawyers,
    getLawyerById,
    uploadAvatar
};

