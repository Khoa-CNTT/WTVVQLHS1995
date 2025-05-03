const pool = require('../config/database');

/**
 * Tạo giao dịch thanh toán mới
 * @param {Object} transactionData - Dữ liệu giao dịch
 * @returns {Promise<Object>} Giao dịch mới được tạo
 */
const createTransaction = async (transactionData) => {
  try {
    const query = `
      INSERT INTO Transactions (
        user_id, lawyer_id, case_id, amount, payment_method,
        status, description, fee_details, payment_provider
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, lawyer_id, case_id, amount, 
        payment_method, status, description, created_at, updated_at,
        fee_details, payment_provider, transaction_code
    `;
    
    const values = [
      transactionData.user_id,
      transactionData.lawyer_id,
      transactionData.case_id,
      transactionData.amount,
      transactionData.payment_method,
      transactionData.status || 'pending',
      transactionData.description || '',
      transactionData.fee_details || null,
      transactionData.payment_provider || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    throw error;
  }
};

/**
 * Lấy thông tin giao dịch theo ID
 * @param {number} transactionId - ID giao dịch
 * @returns {Promise<Object>} Thông tin giao dịch
 */
const getTransactionById = async (transactionId) => {
  try {
    // Kiểm tra và chuyển đổi ID sang số nguyên
    const transactionIdInt = parseInt(transactionId, 10);
    
    // Nếu không thể chuyển đổi thành số nguyên hợp lệ
    if (isNaN(transactionIdInt)) {
      throw new Error(`ID giao dịch không hợp lệ: ${transactionId}`);
    }
    
    const query = `
      SELECT t.*, 
        u.full_name as user_name, u.email as user_email,
        l.full_name as lawyer_name, l.email as lawyer_email,
        c.title as case_title
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN Users l ON t.lawyer_id = l.id
      LEFT JOIN LegalCases c ON t.case_id = c.id
      WHERE t.id = $1
    `;
    
    const result = await pool.query(query, [transactionIdInt]);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi lấy thông tin giao dịch:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái giao dịch
 * @param {number} transactionId - ID giao dịch
 * @param {string} status - Trạng thái mới
 * @param {Object} paymentInfo - Thông tin thanh toán bổ sung
 * @returns {Promise<Object>} Giao dịch đã cập nhật
 */
const updateTransactionStatus = async (transactionId, status, paymentInfo = {}) => {
  try {
    let query = `
      UPDATE Transactions
      SET status = $1, updated_at = NOW()
    `;
    
    const values = [status];
    let paramIndex = 2;
    
    // Thêm thông tin thanh toán nếu có
    if (paymentInfo.transaction_code) {
      query += `, transaction_code = $${paramIndex++}`;
      values.push(paymentInfo.transaction_code);
    }
    
    if (paymentInfo.payment_provider) {
      query += `, payment_provider = $${paramIndex++}`;
      values.push(paymentInfo.payment_provider);
    }
    
    if (paymentInfo.payment_details) {
      query += `, payment_details = $${paramIndex++}`;
      values.push(paymentInfo.payment_details);
    }
    
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(transactionId);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
    throw error;
  }
};

/**
 * Lấy danh sách giao dịch theo luật sư
 * @param {number} lawyerId - ID luật sư
 * @param {Object} options - Tùy chọn lọc và phân trang
 * @returns {Promise<Array>} Danh sách giao dịch
 */
const getTransactionsByLawyer = async (lawyerId, options = {}) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT t.*, 
        u.full_name as user_name, u.email as user_email,
        c.title as case_title
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN LegalCases c ON t.case_id = c.id
      WHERE t.lawyer_id = $1
    `;
    
    const values = [lawyerId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND t.status = $${paramIndex++}`;
      values.push(status);
    }
    
    if (startDate) {
      query += ` AND t.created_at >= $${paramIndex++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND t.created_at <= $${paramIndex++}`;
      values.push(endDate);
    }
    
    // Đếm tổng số giao dịch
    const countQuery = query.replace('t.*, u.full_name as user_name, u.email as user_email, c.title as case_title', 'COUNT(*) as total');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);
    
    // Thêm phân trang
    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    return {
      transactions: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch của luật sư:', error);
    throw error;
  }
};

/**
 * Lấy thống kê tài chính của luật sư
 * @param {number} lawyerId - ID luật sư
 * @param {Object} options - Tùy chọn thời gian
 * @returns {Promise<Object>} Thống kê tài chính
 */
const getLawyerFinancialStats = async (lawyerId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
      FROM Transactions
      WHERE lawyer_id = $1
    `;
    
    const values = [lawyerId];
    let paramIndex = 2;
    
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(endDate);
    }
    
    const result = await pool.query(query, values);
    
    // Lấy thông tin giao dịch gần đây
    const recentQuery = `
      SELECT t.*, 
        u.full_name as user_name, u.email as user_email,
        c.title as case_title
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN LegalCases c ON t.case_id = c.id
      WHERE t.lawyer_id = $1
      ORDER BY t.created_at DESC
      LIMIT 5
    `;
    
    const recentResult = await pool.query(recentQuery, [lawyerId]);
    
    return {
      stats: result.rows[0],
      recentTransactions: recentResult.rows
    };
  } catch (error) {
    console.error('Lỗi khi lấy thống kê tài chính của luật sư:', error);
    throw error;
  }
};

/**
 * Xác nhận thanh toán bởi luật sư
 * @param {number} transactionId - ID giao dịch
 * @param {number} lawyerId - ID luật sư
 * @param {Object} confirmationData - Dữ liệu xác nhận
 * @returns {Promise<Object>} Giao dịch đã xác nhận
 */
const confirmPaymentByLawyer = async (transactionId, lawyerId, confirmationData = {}) => {
  try {
    // Kiểm tra giao dịch tồn tại và thuộc về luật sư
    const checkQuery = `
      SELECT * FROM Transactions 
      WHERE id = $1 AND lawyer_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [transactionId, lawyerId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Không tìm thấy giao dịch hoặc giao dịch không thuộc về luật sư này');
    }
    
    // Cập nhật trạng thái giao dịch
    const updateQuery = `
      UPDATE Transactions
      SET 
        status = 'completed', 
        updated_at = NOW(),
        confirmation_notes = $3,
        confirmation_date = NOW()
      WHERE id = $1 AND lawyer_id = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [
      transactionId, 
      lawyerId,
      confirmationData.notes || ''
    ]);
    
    // Cập nhật trạng thái vụ án nếu cần
    if (confirmationData.updateCaseStatus && updateResult.rows[0].case_id) {
      const caseId = updateResult.rows[0].case_id;
      
      const updateCaseQuery = `
        UPDATE LegalCases
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1 AND lawyer_id = $2
        RETURNING id
      `;
      
      await pool.query(updateCaseQuery, [caseId, lawyerId]);
    }
    
    return updateResult.rows[0];
  } catch (error) {
    console.error('Lỗi khi xác nhận thanh toán:', error);
    throw error;
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  updateTransactionStatus,
  getTransactionsByLawyer,
  getLawyerFinancialStats,
  confirmPaymentByLawyer
}; 