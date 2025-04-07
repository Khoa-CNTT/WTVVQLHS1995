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

// Tạo người dùng mới
const createUser = async (username, password, email, phone, fullName) => {
    try {
        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Thêm người dùng vào database
        const result = await pool.query(
            `INSERT INTO users 
            (username, password, email, phone, full_name, role, is_verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id, username, email, full_name, role, is_verified`,
            [username, hashedPassword, email, phone, fullName, 'user', false]
        );
        
        return result.rows[0];
    } catch (error) {
        throw new Error(`Lỗi tạo người dùng: ${error.message}`);
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

// Lấy thông tin người dùng theo ID
const getUserById = async (userId) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, phone, full_name, role, is_verified FROM users WHERE id = $1',
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

module.exports = {
    checkUserExists,
    createUser,
    verifyUser,
    getUserById
}; 