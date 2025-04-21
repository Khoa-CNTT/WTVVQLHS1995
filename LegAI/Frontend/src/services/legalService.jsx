import axios from 'axios';
import { API_URL } from '../config/constants';

/**
 * Lấy token từ localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Cấu hình headers cho request
 */
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

/**
 * Tìm kiếm văn bản pháp luật
 * @param {Object} searchParams - Tham số tìm kiếm
 * @param {string} searchParams.q - Từ khóa tìm kiếm
 * @param {string} searchParams.type - Loại văn bản
 * @param {string} searchParams.fromDate - Từ ngày (định dạng YYYY-MM-DD)
 * @param {string} searchParams.toDate - Đến ngày (định dạng YYYY-MM-DD)
 * @param {number} searchParams.page - Trang hiện tại
 * @param {number} searchParams.limit - Số kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm văn bản pháp luật
 */
const searchLegalDocuments = async (searchParams = {}) => {
  try {
    const { q = '', type = '', fromDate = '', toDate = '', page = 1, limit = 10 } = searchParams;
    
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    if (type) queryParams.append('type', type);
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/legal/documents?${queryParams.toString()}`, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản pháp luật:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết văn bản pháp luật
 * @param {number} id - ID văn bản cần lấy
 * @returns {Promise<Object>} Thông tin chi tiết văn bản
 */
const getLegalDocumentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/legal/documents/${id}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin văn bản ID=${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách loại văn bản pháp luật
 * @returns {Promise<Array>} Danh sách loại văn bản
 */
const getDocumentTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/document-types`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại văn bản:', error);
    throw error;
  }
};

/**
 * Tìm kiếm mẫu văn bản
 * @param {Object} searchParams - Tham số tìm kiếm
 * @param {string} searchParams.q - Từ khóa tìm kiếm
 * @param {string} searchParams.type - Loại mẫu văn bản
 * @param {number} searchParams.page - Trang hiện tại
 * @param {number} searchParams.limit - Số kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm mẫu văn bản
 */
const searchDocumentTemplates = async (searchParams = {}) => {
  try {
    const { q = '', type = '', page = 1, limit = 10 } = searchParams;
    
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    if (type) queryParams.append('type', type);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/legal/templates?${queryParams.toString()}`, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm mẫu văn bản:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết mẫu văn bản
 * @param {number} id - ID mẫu văn bản cần lấy
 * @returns {Promise<Object>} Thông tin chi tiết mẫu văn bản
 */
const getDocumentTemplateById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/legal/templates/${id}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin mẫu văn bản ID=${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách loại mẫu văn bản
 * @returns {Promise<Array>} Danh sách loại mẫu văn bản
 */
const getTemplateTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/template-types`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', error);
    throw error;
  }
};

/**
 * Tìm kiếm tổng hợp (cả văn bản pháp luật và mẫu văn bản)
 * @param {Object} searchParams - Tham số tìm kiếm
 * @param {string} searchParams.q - Từ khóa tìm kiếm
 * @param {number} searchParams.page - Trang hiện tại
 * @param {number} searchParams.limit - Số kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm tổng hợp
 */
const searchAll = async (searchParams = {}) => {
  try {
    const { q = '', page = 1, limit = 10 } = searchParams;
    
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/legal/search?${queryParams.toString()}`, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tổng hợp:', error);
    throw error;
  }
};

export default {
  searchLegalDocuments,
  getLegalDocumentById,
  getDocumentTypes,
  searchDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll
}; 