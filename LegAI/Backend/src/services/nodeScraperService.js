const pool = require('../config/database');
const scraperUtils = require('../utils/scraperUtil');

/**
 * Thu thập dữ liệu hợp đồng sử dụng Node.js
 * @param {number} userId - ID của người dùng đang thực hiện thao tác
 * @param {number} limit - Số lượng hợp đồng cần thu thập
 * @returns {Promise<{success: boolean, message: string, count: number}>}
 */
const scrapeContractsWithNode = async (userId, limit = 10) => {
  try {
    // Ghi log bắt đầu
    console.log(`Bắt đầu thu thập dữ liệu hợp đồng (Node.js) với giới hạn ${limit}...`);
    
    // Thu thập dữ liệu
    const contracts = await scraperUtils.scrapeContracts(limit);
    
    // Lưu vào database
    const saveResult = await scraperUtils.saveContractsToDatabase(contracts);
    
    
    // Ghi log vào AuditLogs
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'NODE_SCRAPE', 'Contracts', 0, `Thu thập dữ liệu hợp đồng bằng Node.js: ${saveResult.count}/${contracts.length}`]
    );
    
    return {
      success: true,
      message: `Thu thập thành công hợp đồng`,
      count: saveResult.count,
      total: contracts.length
    };
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu hợp đồng:', error);
    
    // Ghi log lỗi
    try {
      await pool.query(
        `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'NODE_SCRAPE_ERROR', 'Contracts', 0, `Lỗi khi thu thập dữ liệu hợp đồng: ${error.message}`]
      );
    } catch (logError) {
      console.error('Lỗi khi ghi log lỗi:', logError);
    }
    
    throw error;
  }
};

/**
 * Thu thập dữ liệu văn bản pháp luật sử dụng Node.js
 * @param {number} userId - ID của người dùng đang thực hiện thao tác
 * @param {number} limit - Số lượng văn bản cần thu thập
 * @returns {Promise<{success: boolean, message: string, count: number}>}
 */
const scrapeLegalDocumentsWithNode = async (userId, limit = 10) => {
  try {
    // Ghi log bắt đầu
    console.log(`Bắt đầu thu thập dữ liệu văn bản pháp luật (Node.js) với giới hạn ${limit}...`);
    
    // Thu thập dữ liệu
    const documents = await scraperUtils.scrapeLegalDocuments(limit);
    
    // Lưu vào database
    const saveResult = await scraperUtils.saveLegalDocumentsToDatabase(documents);
    
    // Ghi log kết quả
    
    // Ghi log vào AuditLogs
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'NODE_SCRAPE', 'LegalDocuments', 0, `Thu thập dữ liệu văn bản pháp luật bằng Node.js: ${saveResult.count}/${documents.length}`]
    );
    
    return {
      success: true,
      message: `Thu thập thành công văn bản pháp luật`,
      count: saveResult.count,
      total: documents.length
    };
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu văn bản pháp luật:', error);
    
    // Ghi log lỗi
    try {
      await pool.query(
        `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'NODE_SCRAPE_ERROR', 'LegalDocuments', 0, `Lỗi khi thu thập dữ liệu văn bản pháp luật: ${error.message}`]
      );
    } catch (logError) {
      console.error('Lỗi khi ghi log lỗi:', logError);
    }
    
    throw error;
  }
};

/**
 * Lấy trạng thái thu thập dữ liệu gần đây
 * @param {number} limit - Số lượng bản ghi cần lấy
 * @returns {Promise<Array>} Danh sách các bản ghi
 */
const getScrapingStatus = async (limit = 10) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, action, table_name, record_id, details, created_at 
       FROM AuditLogs 
       WHERE action IN ('NODE_SCRAPE', 'NODE_SCRAPE_ERROR') 
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái thu thập dữ liệu:', error);
    throw error;
  }
};

module.exports = {
  scrapeContractsWithNode,
  scrapeLegalDocumentsWithNode,
  getScrapingStatus
}; 