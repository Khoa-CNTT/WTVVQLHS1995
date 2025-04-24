const pool = require('../config/database');
const scraperUtils = require('../utils/scraperUtil');
const auditLogModel = require('../models/auditLogModel');

/**
 * Tự động cập nhật văn bản pháp luật mới từ nguồn dữ liệu
 * @param {number} limit - Số lượng văn bản cần thu thập
 * @returns {Promise<{success: boolean, message: string, count: number, total: number}>}
 */
const autoUpdateLegalDocuments = async (limit = 10) => {
  try {
    console.log(`[AUTO] Bắt đầu tự động cập nhật văn bản pháp luật với giới hạn ${limit}...`);
    
    // Thu thập dữ liệu văn bản pháp luật
    const documents = await scraperUtils.scrapeLegalDocuments(limit);
    
    // Lưu vào database
    const savedCount = await scraperUtils.saveLegalDocumentsToDatabase(documents);
    
    // Ghi log vào AuditLogs nếu có văn bản mới được cập nhật
    if (savedCount > 0) {
      await auditLogModel.addAuditLog({
        userId: 1, // Admin system user ID
        action: 'AUTO_UPDATE',
        tableName: 'LegalDocuments',
        recordId: 0,
        details: `Tự động cập nhật ${savedCount} văn bản pháp luật mới`,
        notificationShown: false
      });
      
      console.log(`[AUTO] Đã cập nhật thành công ${savedCount}/${documents.length} văn bản pháp luật`);
    } else {
      console.log(`[AUTO] Không có văn bản pháp luật mới để cập nhật`);
    }
    
    return {
      success: true,
      message: `Tự động cập nhật văn bản pháp luật thành công`,
      count: savedCount,
      total: documents.length
    };
  } catch (error) {
    console.error('[AUTO] Lỗi khi tự động cập nhật văn bản pháp luật:', error);
    
    // Ghi log lỗi
    try {
      await auditLogModel.addAuditLog({
        userId: 1, // Admin system user ID
        action: 'AUTO_UPDATE_ERROR',
        tableName: 'LegalDocuments',
        recordId: 0,
        details: `Lỗi khi tự động cập nhật văn bản pháp luật: ${error.message}`,
        notificationShown: false
      });
    } catch (logError) {
      console.error('[AUTO] Lỗi khi ghi log lỗi:', logError);
    }
    
    throw error;
  }
};

/**
 * Lấy thông báo cập nhật tự động mới cho dashboard admin
 * @returns {Promise<Array>} Danh sách các thông báo từ audit log chưa hiển thị
 */
const getNewUpdateNotifications = async () => {
  try {
    const notifications = await auditLogModel.getAuditLogs({
      actions: ['AUTO_UPDATE', 'AUTO_UPDATE_ERROR'],
      notificationShown: false
    });
    
    return notifications;
  } catch (error) {
    console.error('Lỗi khi lấy thông báo cập nhật tự động:', error);
    throw error;
  }
};

/**
 * Đánh dấu thông báo đã được hiển thị
 * @param {number} notificationId - ID của thông báo trong bảng AuditLogs
 */
const markNotificationAsShown = async (notificationId) => {
  try {
    return await auditLogModel.updateNotificationStatus(notificationId, true);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái thông báo:', error);
    return false;
  }
};

/**
 * Lấy thông tin về lần cập nhật tự động cuối cùng
 * @returns {Promise<Array>} Thông tin về lần cập nhật cuối cùng
 */
const getLastUpdateTime = async () => {
  try {
    const logs = await auditLogModel.getAuditLogs({
      actions: ['AUTO_UPDATE'],
      limit: 1,
      offset: 0
    });
    
    return logs;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin lần cập nhật cuối cùng:', error);
    return [];
  }
};

module.exports = {
  autoUpdateLegalDocuments,
  getNewUpdateNotifications,
  markNotificationAsShown,
  getLastUpdateTime
}; 