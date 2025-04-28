const pool = require('../config/database');

/**
 * Thêm bản ghi vào bảng AuditLogs
 * @param {Object} logData - Dữ liệu log cần thêm
 * @param {number} logData.userId - ID của người dùng thực hiện hành động
 * @param {string} logData.action - Hành động được thực hiện
 * @param {string} logData.tableName - Tên bảng dữ liệu liên quan
 * @param {number} logData.recordId - ID của bản ghi liên quan
 * @param {string} logData.details - Chi tiết hành động
 * @param {boolean} [logData.notificationShown=false] - Đã hiển thị thông báo chưa
 * @returns {Promise<Object>} Bản ghi đã được thêm vào
 */
const addAuditLog = async (logData) => {
  try {
    const { userId, action, tableName, recordId, details, notificationShown = false } = logData;
    
    const query = `
      INSERT INTO AuditLogs (user_id, action, table_name, record_id, details, notification_shown)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, action, table_name, record_id, details, notification_shown, created_at
    `;
    
    const values = [userId, action, tableName, recordId, details, notificationShown];
    
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi thêm audit log:', error);
    throw error;
  }
};

/**
 * Lấy danh sách các bản ghi audit log
 * @param {Object} options - Tùy chọn cho việc lấy dữ liệu
 * @param {string[]} [options.actions] - Danh sách các hành động cần lọc
 * @param {boolean} [options.notificationShown] - Lọc theo trạng thái đã hiển thị thông báo
 * @param {number} [options.limit=10] - Số lượng bản ghi tối đa
 * @param {number} [options.offset=0] - Vị trí bắt đầu lấy
 * @returns {Promise<Array>} Danh sách các bản ghi
 */
const getAuditLogs = async (options = {}) => {
  try {
    const { actions, notificationShown, limit = 10, offset = 0 } = options;
    
    let query = `
      SELECT id, user_id, action, table_name, record_id, details, notification_shown, created_at
      FROM AuditLogs
      WHERE 1=1
    `;
    
    const values = [];
    let valueIndex = 1;
    
    if (actions && actions.length > 0) {
      const actionPlaceholders = actions.map(() => `$${valueIndex++}`).join(', ');
      query += ` AND action IN (${actionPlaceholders})`;
      values.push(...actions);
    }
    
    if (notificationShown !== undefined) {
      query += ` AND notification_shown = $${valueIndex++}`;
      values.push(notificationShown);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách audit logs:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái hiển thị thông báo của audit log
 * @param {number} logId - ID của bản ghi audit log
 * @param {boolean} shown - Trạng thái hiển thị mới
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
const updateNotificationStatus = async (logId, shown = true) => {
  try {
    const query = `
      UPDATE AuditLogs
      SET notification_shown = $1
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [shown, logId]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hiển thị thông báo:', error);
    throw error;
  }
};

module.exports = {
  addAuditLog,
  getAuditLogs,
  updateNotificationStatus
}; 