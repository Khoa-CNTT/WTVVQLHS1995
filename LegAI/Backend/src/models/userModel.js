const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Tìm user theo id
const findById = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Tìm lawyer theo id
const findLawyerById = async (lawyerId) => {
  try {
    const result = await pool.query(
      "SELECT u.*, ld.rating, ld.specialization, ld.experience_years FROM Users u JOIN LawyerDetails ld ON u.id = ld.lawyer_id WHERE u.id = $1 AND u.role = 'Lawyer'",
      [lawyerId]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Tìm user theo email
const findByEmail = async (email) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Tìm user theo username
const findByUsername = async (username) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Tìm lawyer theo tiêu chí
const findLawyers = async (criteria = {}) => {
  try {
    const { searchTerm, specialization, page = 1, limit = 10 } = criteria;
    
    let query = `
      SELECT u.*, ld.rating, ld.specialization, ld.experience_years
      FROM Users u 
      JOIN LawyerDetails ld ON u.id = ld.lawyer_id 
      WHERE u.role = 'Lawyer'
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (searchTerm) {
      query += ` AND (u.full_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    if (specialization) {
      query += ` AND ld.specialization = $${paramIndex}`;
      queryParams.push(specialization);
      paramIndex++;
    }
    
    // Thêm phân trang
    const offset = (page - 1) * limit;
    query += ` ORDER BY ld.rating DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Tạo user mới
const createUser = async (userData) => {
  const { username, email, password, fullName, phone, role = 'User' } = userData;
  
  try {
    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await pool.query(
      `INSERT INTO Users (username, email, password, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [username, email, hashedPassword, fullName, phone, role]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Cập nhật user
const updateUser = async (userId, userData) => {
  try {
    // Xây dựng câu truy vấn động dựa trên dữ liệu cập nhật
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(userData)) {
      // Đổi camelCase sang snake_case cho tên cột
      const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updateFields.push(`${columnName} = $${paramIndex}`);
      queryParams.push(value);
      paramIndex++;
    }
    
    // Thêm id vào danh sách tham số
    queryParams.push(userId);
    
    const query = `
      UPDATE Users
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Cập nhật mật khẩu
const updatePassword = async (userId, newPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const result = await pool.query(
      `UPDATE Users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [hashedPassword, userId]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// So sánh mật khẩu
const comparePassword = async (inputPassword, hashedPassword) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

module.exports = {
  findById,
  findLawyerById,
  findByEmail,
  findByUsername,
  findLawyers,
  createUser,
  updateUser,
  updatePassword,
  comparePassword
};
