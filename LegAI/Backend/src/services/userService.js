const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Kiểm tra username hoặc email đã tồn tại chưa
const checkUserExists = async (username, email) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows.length > 0;
    } catch (error) {
        throw new Error(`Lỗi kiểm tra người dùng: ${error.message}`);
    }
};

// Tạo người dùng mới và profile
const createUser = async (username, password, email, phone, fullName) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Thêm người dùng vào bảng Users
        const userResult = await client.query(
            `INSERT INTO users 
            (username, password, email, phone, full_name, role, is_verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, username, email, full_name, role, is_verified`,
            [username, hashedPassword, email, phone, fullName, 'user', false]
        );
        
        // Tạo profile mặc định cho user
        await client.query(
            `INSERT INTO userprofiles 
            (user_id, address, avatar_url, bio) 
            VALUES ($1, $2, $3, $4)`,
            [userResult.rows[0].id, '', '/default-avatar.png', '']
        );
        
        await client.query('COMMIT');
        return userResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Lỗi tạo người dùng: ${error.message}`);
    } finally {
        client.release();
    }
};

// Cập nhật trạng thái xác minh cho người dùng
const verifyUser = async (userId) => {
    try {
        const result = await pool.query(
            'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, username, email, is_verified',
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Không tìm thấy người dùng');
        }
        
        return result.rows[0];
    } catch (error) {
        throw new Error(`Lỗi xác minh người dùng: ${error.message}`);
    }
};

// Lấy thông tin người dùng và profile theo ID
const getUserById = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT u.*, up.address, up.avatar_url, up.bio 
            FROM users u 
            LEFT JOIN userprofiles up ON u.id = up.user_id 
            WHERE u.id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        throw new Error(`Lỗi lấy thông tin người dùng: ${error.message}`);
    }
};

// Lấy danh sách người dùng với phân trang và tìm kiếm
const getUsers = async (page = 1, limit = 10, searchTerm = '', role = '') => {
    try {
        const offset = (page - 1) * limit;
        let query = `
            SELECT u.*, up.address, up.avatar_url, up.bio 
            FROM users u 
            LEFT JOIN userprofiles up ON u.id = up.user_id 
            WHERE 1=1
        `;
        const params = [];

        if (searchTerm) {
            params.push(`%${searchTerm}%`);
            query += ` AND (u.username ILIKE $${params.length} 
                OR u.email ILIKE $${params.length} 
                OR u.full_name ILIKE $${params.length})`;
        }

        if (role) {
            params.push(role);
            query += ` AND u.role = $${params.length}`;
        }

        // Tổng số người dùng
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM (${query}) as count_query`,
            params
        );
        const totalUsers = parseInt(countResult.rows[0].count);

        // Lấy danh sách người dùng với phân trang
        query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return {
            users: result.rows,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit)
        };
    } catch (error) {
        throw new Error(`Lỗi lấy danh sách người dùng: ${error.message}`);
    }
};

// Cập nhật thông tin người dùng và profile
const updateUser = async (userId, userData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Đảm bảo dữ liệu không bị null
        const fullName = userData.fullName || ''; 
        const phone = userData.phone || '';
        const role = userData.role || 'User';
        const address = userData.address || '';
        const bio = userData.bio || '';
        
        // Cập nhật thông tin cơ bản
        const userResult = await client.query(
            `UPDATE users 
            SET full_name = $1, phone = $2, role = $3, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $4 
            RETURNING *`,
            [fullName, phone, role, userId]
        );

        if (userResult.rows.length === 0) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Cập nhật profile
        const profileResult = await client.query(
            `UPDATE userprofiles 
            SET address = $1, bio = $2, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $3 
            RETURNING *`,
            [address, bio, userId]
        );

        await client.query('COMMIT');
        
        // Kết hợp dữ liệu trả về
        const result = {
            ...userResult.rows[0],
            address: address,
            bio: bio
        };
        
        // Nếu profile được cập nhật, ghi đè các trường
        if (profileResult.rows.length > 0) {
            result.address = profileResult.rows[0].address;
            result.bio = profileResult.rows[0].bio;
            result.avatar_url = profileResult.rows[0].avatar_url;
        }
        
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Lỗi cập nhật thông tin người dùng: ${error.message}`);
    } finally {
        client.release();
    }
};

// Khóa/mở khóa tài khoản
const toggleUserLock = async (userId) => {
    try {
        const result = await pool.query(
            `UPDATE users 
            SET is_locked = NOT is_locked, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING *`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Không tìm thấy người dùng');
        }
        
        return result.rows[0];
    } catch (error) {
        throw new Error(`Lỗi thay đổi trạng thái khóa: ${error.message}`);
    }
};

// Đặt lại mật khẩu cho người dùng
const resetPassword = async (userId, newPassword) => {
    try {
        // Kiểm tra độ dài mật khẩu
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu trong database
        const result = await pool.query(
            `UPDATE users 
            SET password = $1, failed_attempts = 0, is_locked = false, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *`,
            [hashedPassword, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Không tìm thấy người dùng');
        }

        return result.rows[0];
    } catch (error) {
        throw new Error(`Lỗi đặt lại mật khẩu: ${error.message}`);
    }
};

// Xóa người dùng
const deleteUser = async (userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Kiểm tra xem người dùng có tồn tại không
        const checkUser = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (checkUser.rows.length === 0) {
            throw new Error('Không tìm thấy người dùng');
        }
        
        // Xóa dữ liệu liên quan trong userprofiles trước
        await client.query('DELETE FROM userprofiles WHERE user_id = $1', [userId]);
        
        // Xóa trong bảng users
        const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [userId]);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Lỗi xóa người dùng: ${error.message}`);
    } finally {
        client.release();
    }
};

// Tìm người dùng theo username
const getUserByUsername = async (username) => {
    try {
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (userQuery.rows.length === 0) {
            return null;
        }
        
        return userQuery.rows[0];
    } catch (error) {
        console.error('Lỗi khi tìm người dùng theo username:', error);
        throw new Error('Lỗi hệ thống khi tìm kiếm người dùng');
    }
};

// Tìm người dùng theo email
const getUserByEmail = async (email) => {
    try {
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (userQuery.rows.length === 0) {
            return null;
        }
        
        return userQuery.rows[0];
    } catch (error) {
        console.error('Lỗi khi tìm người dùng theo email:', error);
        throw new Error('Lỗi hệ thống khi tìm kiếm người dùng');
    }
};

// Cache để lưu các token đặt lại mật khẩu
const passwordResetTokens = new Map();

// Tạo token đặt lại mật khẩu
const createPasswordResetToken = async (userId, email) => {
    try {
        // Tạo OTP ngẫu nhiên 6 chữ số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Thời gian hết hạn OTP (15 phút)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        // Lưu token vào cache
        passwordResetTokens.set(userId.toString(), {
            otp,
            email,
            expiresAt,
            attempts: 0
        });
        
        // Gửi email chứa OTP sẽ được xử lý ở Frontend thông qua EmailJS
        
        return { otp, expiresAt };
    } catch (error) {
        throw new Error(`Lỗi tạo token đặt lại mật khẩu: ${error.message}`);
    }
};

// Xác minh token đặt lại mật khẩu
const verifyPasswordResetToken = async (userId, otp) => {
    try {
        const tokenData = passwordResetTokens.get(userId.toString());
        
        // Kiểm tra OTP có tồn tại không
        if (!tokenData) {
            throw new Error('Mã OTP không tồn tại hoặc đã hết hạn');
        }
        
        // Kiểm tra OTP có hết hạn không
        if (new Date() > tokenData.expiresAt) {
            passwordResetTokens.delete(userId.toString());
            throw new Error('Mã OTP đã hết hạn');
        }
        
        // Kiểm tra OTP có đúng không
        if (tokenData.otp !== otp) {
            // Tăng số lần thử
            tokenData.attempts += 1;
            
            // Nếu thử sai quá 3 lần, xóa OTP
            if (tokenData.attempts >= 3) {
                passwordResetTokens.delete(userId.toString());
                throw new Error('Bạn đã nhập sai OTP quá nhiều lần');
            }
            
            throw new Error('Mã OTP không đúng');
        }
        
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    checkUserExists,
    createUser,
    verifyUser,
    getUserById,
    getUsers,
    updateUser,
    toggleUserLock,
    resetPassword,
    deleteUser,
    getUserByUsername,
    getUserByEmail,
    createPasswordResetToken,
    verifyPasswordResetToken
}; 