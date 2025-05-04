const pool = require('../config/database');

/**
 * Lưu cuộc tư vấn AI vào database
 * @param {number|null} userId - ID của người dùng, có thể null nếu không đăng nhập
 * @param {string} question - Câu hỏi của người dùng
 * @param {string} answer - Câu trả lời từ AI
 * @returns {Promise<object>} - Kết quả lưu vào database
 */
const saveAIConsultation = async (userId, question, answer) => {
  try {
    console.log('Model: Đang lưu AI consultation với user_id:', userId || 'anonymous');
    
    // Kiểm tra kết nối
    await pool.query('SELECT 1');
    
    // Thực hiện truy vấn INSERT
    const insertQuery = `
      INSERT INTO AIConsultations (user_id, question, answer, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, created_at
    `;
    
    const result = await pool.query(insertQuery, [userId, question, answer]);
    
    if (result.rows && result.rows.length > 0) {
      console.log('Model: Lưu AI consultation thành công, ID:', result.rows[0].id);
      return {
        success: true,
        record: result.rows[0]
      };
    } else {
      console.error('Model: Lưu AI consultation thất bại: không có dữ liệu trả về');
      return {
        success: false,
        error: 'Không có dữ liệu trả về từ truy vấn INSERT'
      };
    }
  } catch (error) {
    console.error('Model: Lỗi khi lưu AI consultation:', error);
    console.error('Chi tiết lỗi DB:', {
      code: error.code || 'không có mã',
      detail: error.detail || 'không có chi tiết',
      message: error.message || 'không có thông báo',
      constraint: error.constraint || 'không có ràng buộc'
    });
    
    return {
      success: false,
      error: error.message || 'Lỗi database không xác định',
      errorCode: error.code
    };
  }
};

/**
 * Lấy lịch sử chat AI của một người dùng
 * @param {number} userId - ID của người dùng
 * @param {number} limit - Số lượng bản ghi tối đa
 * @returns {Promise<Array>} - Danh sách các cuộc tư vấn AI
 */
const getAIChatHistoryByUser = async (userId, limit = 100) => {
  try {
    console.log('Model: Lấy lịch sử chat AI cho user_id:', userId);
    
    const query = `
      SELECT * FROM AIConsultations 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    
    console.log(`Model: Tìm thấy ${result.rowCount} bản ghi lịch sử chat AI`);
    return result.rows;
  } catch (error) {
    console.error('Model: Lỗi khi lấy lịch sử chat AI:', error);
    throw error;
  }
};

/**
 * Lấy tất cả cuộc tư vấn AI
 * @param {Object} filters - Các bộ lọc (search, userId, page, limit)
 * @returns {Promise<Object>} - Danh sách cuộc tư vấn AI và thông tin phân trang
 */
const getAllAIConsultations = async (filters = {}) => {
  try {
    const { search, userId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    
    let queryParams = [];
    let paramCounter = 1;
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(`(question ILIKE $${paramCounter} OR answer ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }
    
    if (userId) {
      whereConditions.push(`user_id = $${paramCounter}`);
      queryParams.push(userId);
      paramCounter++;
    }
    
    // Xây dựng where clause
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // Truy vấn dữ liệu
    const query = `
      SELECT a.*, u.username, u.email, u.full_name
      FROM AIConsultations a
      LEFT JOIN Users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // Thực hiện truy vấn
    const result = await pool.query(query, queryParams);
    
    // Đếm tổng số lượng bản ghi
    const countQuery = `
      SELECT COUNT(*) as total
      FROM AIConsultations a
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
    const total = parseInt(countResult.rows[0].total);
    
    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Model: Lỗi khi lấy danh sách cuộc tư vấn AI:', error);
    throw error;
  }
};

module.exports = {
  saveAIConsultation,
  getAIChatHistoryByUser,
  getAllAIConsultations
}; 