const path = require('path');
const pool = require('../config/database');
const pythonUtils = require('../utils/pythonUtils');
const fs = require('fs');

/**
 * Thu thập dữ liệu hợp đồng từ Scrapy spider
 * @param {number} userId - ID của người dùng đang thực hiện thao tác
 * @returns {Promise<{success: boolean, message: string}>}
 */
const scrapeContracts = async (userId) => {
  try {
    // Đường dẫn tới thư mục scrapy project
    const scrapyProjectPath = 'python/legal_scraper';
    
    console.log('Bắt đầu quá trình thu thập dữ liệu hợp đồng...');
    
    // Thực thi spider
    const result = await pythonUtils.executePythonScript('scrapy crawl contract_document_spider', [], scrapyProjectPath);
    
    console.log(`Quá trình thu thập hợp đồng kết thúc với mã: ${result.exitCode}`);
    
    // Ghi log vào AuditLogs
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'RUN_SPIDER', 'Contracts', 0, `Thu thập dữ liệu hợp đồng (mã: ${result.exitCode})`]
    );
    
    return {
      success: result.exitCode === 0,
      message: result.exitCode === 0 
        ? 'Thu thập dữ liệu hợp đồng thành công' 
        : 'Có lỗi xảy ra khi thu thập dữ liệu hợp đồng',
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    };
  } catch (error) {
    console.error('Lỗi khi chạy spider contracts:', error);
    throw error;
  }
};

/**
 * Thu thập dữ liệu văn bản pháp luật từ Scrapy spider
 * @param {number} userId - ID của người dùng đang thực hiện thao tác
 * @returns {Promise<{success: boolean, message: string}>}
 */
const scrapeLegalDocuments = async (userId) => {
  try {
    // Đường dẫn tới thư mục scrapy project
    const scrapyProjectPath = 'python/legal_scraper';
    
    console.log('Bắt đầu quá trình thu thập dữ liệu văn bản pháp luật...');
    
    // Thực thi spider
    const result = await pythonUtils.executePythonScript('scrapy crawl legal_document_spider', [], scrapyProjectPath);
    
    console.log(`Quá trình thu thập văn bản pháp luật kết thúc với mã: ${result.exitCode}`);
    
    // Ghi log vào AuditLogs
    await pool.query(
      `INSERT INTO AuditLogs (user_id, action, table_name, record_id, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'RUN_SPIDER', 'LegalDocuments', 0, `Thu thập dữ liệu văn bản pháp luật (mã: ${result.exitCode})`]
    );
    
    return {
      success: result.exitCode === 0,
      message: result.exitCode === 0 
        ? 'Thu thập dữ liệu văn bản pháp luật thành công' 
        : 'Có lỗi xảy ra khi thu thập dữ liệu văn bản pháp luật',
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    };
  } catch (error) {
    console.error('Lỗi khi chạy spider legal documents:', error);
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
       WHERE action = 'RUN_SPIDER' 
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái thu thập dữ liệu:', error);
    throw error;
  }
};

/**
 * Kiểm tra xem thư mục Python có tồn tại hay không
 * @returns {Promise<{exists: boolean, path: string}>}
 */
const checkPythonDirectory = async () => {
  try {
    const pythonDir = path.join(process.cwd(), 'python');
    const scraperDir = path.join(pythonDir, 'legal_scraper');
    
    const pythonDirExists = fs.existsSync(pythonDir);
    const scraperDirExists = fs.existsSync(scraperDir);
    
    return {
      exists: pythonDirExists && scraperDirExists,
      pythonPath: pythonDir,
      scraperPath: scraperDir
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra thư mục Python:', error);
    throw error;
  }
};

module.exports = {
  scrapeContracts,
  scrapeLegalDocuments,
  getScrapingStatus,
  checkPythonDirectory
}; 