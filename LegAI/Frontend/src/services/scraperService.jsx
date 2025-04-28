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

/**
 * Lấy thông báo cập nhật tự động văn bản pháp luật mới
 * @returns {Promise<Array>} - Danh sách thông báo mới
 */
const getAutoUpdateNotifications = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/auto-update/notifications`, 
      getHeaders()
    );
    
    
    if (response.data && response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data
      };
    } else if (response.data && Array.isArray(response.data)) {
      // Trường hợp API trả về mảng trực tiếp
      return {
        success: true,
        data: response.data
      };
    } else {
      console.warn('Định dạng phản hồi từ API không đúng:', response.data);
      return {
        success: false,
        data: []
      };
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông báo cập nhật tự động:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Đánh dấu thông báo đã được hiển thị
 * @param {number} notificationId - ID của thông báo
 * @returns {Promise<object>} - Kết quả cập nhật
 */
const markNotificationAsShown = async (notificationId) => {
  try {
    const response = await axios.put(
      `${API_URL}/auto-update/notifications/${notificationId}`, 
      {}, 
      getHeaders()
    );
    
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Đã đánh dấu thông báo là đã đọc'
      };
    } else {
      console.warn('Định dạng phản hồi từ API không đúng:', response.data);
      return {
        success: false,
        message: 'Không thể đánh dấu thông báo'
      };
    }
  } catch (error) {
    console.error('Lỗi khi đánh dấu thông báo đã hiển thị:', error);
    return {
      success: false,
      message: error.message || 'Lỗi khi đánh dấu thông báo',
      error: error
    };
  }
};

/**
 * Chạy cập nhật văn bản pháp luật tự động theo yêu cầu
 * @param {number} limit - Số lượng văn bản cần cập nhật
 * @returns {Promise<object>} - Kết quả cập nhật
 */
const runAutoUpdate = async (limit = 10) => {
  try {
    const response = await axios.post(
      `${API_URL}/auto-update/legal-documents`, 
      { limit }, 
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật tự động văn bản pháp luật:', error);
    throw error;
  }
};

/**
 * Kiểm tra kết nối API
 * @returns {Promise<boolean>} - Kết quả kiểm tra
 */
const testApiConnection = async () => {
  try {
    // Sử dụng endpoint đơn giản nhất để kiểm tra
    const response = await axios.get(
      `${API_URL}/auth/verify-token`, 
      getHeaders()
    );
    return true;
  } catch (error) {
    console.error('Lỗi kết nối API:', error);
    return false;
  }
};

export default {
  scrapeContracts,
  scrapeLegalDocuments,
  getScrapingStatus,
  getAutoUpdateNotifications,
  markNotificationAsShown,
  runAutoUpdate,
  testApiConnection
}; 