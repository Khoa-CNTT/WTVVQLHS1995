import axios from 'axios';
import { API_URL } from '../config/constants';

// Lấy token từ localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Cấu hình headers với token xác thực
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Thu thập dữ liệu hợp đồng từ thư viện pháp luật
 * @param {number} limit - Số lượng hợp đồng cần thu thập
 * @param {boolean} background - Chạy trong nền hay không
 * @returns {Promise<object>} - Kết quả thu thập dữ liệu
 */
const scrapeContracts = async (limit = 10, background = true) => {
  try {
    const response = await axios.post(
      `${API_URL}/node-scraper/contracts`, 
      { limit, background }, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu hợp đồng:', error);
    throw error;
  }
};

/**
 * Thu thập dữ liệu văn bản pháp luật từ thư viện pháp luật
 * @param {number} limit - Số lượng văn bản cần thu thập
 * @param {boolean} background - Chạy trong nền hay không
 * @returns {Promise<object>} - Kết quả thu thập dữ liệu
 */
const scrapeLegalDocuments = async (limit = 10, background = true) => {
  try {
    const response = await axios.post(
      `${API_URL}/node-scraper/legal-documents`, 
      { limit, background }, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu văn bản pháp luật:', error);
    throw error;
  }
};

/**
 * Lấy trạng thái thu thập dữ liệu gần đây
 * @param {number} limit - Số lượng bản ghi cần lấy
 * @returns {Promise<object>} - Kết quả trạng thái thu thập dữ liệu
 */
const getScrapingStatus = async (limit = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/node-scraper/status?limit=${limit}`, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái thu thập dữ liệu:', error);
    throw error;
  }
};

export default {
  scrapeContracts,
  scrapeLegalDocuments,
  getScrapingStatus
}; 