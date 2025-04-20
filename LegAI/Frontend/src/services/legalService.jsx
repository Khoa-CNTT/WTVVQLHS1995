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
 * @param {string} searchParams.issuingBody - Cơ quan ban hành
 * @param {string} searchParams.field - Lĩnh vực
 * @param {string} searchParams.status - Trạng thái hiệu lực
 * @param {number} searchParams.page - Trang hiện tại
 * @param {number} searchParams.limit - Số kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm văn bản pháp luật
 */
const searchLegalDocuments = async (searchParams = {}) => {
  try {
    // Trích xuất tất cả tham số với giá trị mặc định
    const { 
      q = '', 
      type = '', 
      fromDate = null, 
      toDate = null, 
      issuingBody = '',
      field = '',
      status = '',
      page = 1, 
      limit = 10 
    } = searchParams;
    
    const queryParams = new URLSearchParams();
    
    // Đảm bảo tham số q (từ khóa tìm kiếm) luôn được gửi, ngay cả khi là chuỗi trống
    queryParams.append('q', q);
    
    // Thêm tất cả các tham số lọc nếu có giá trị
    if (type) queryParams.append('type', type);
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);
    if (issuingBody) queryParams.append('issuingBody', issuingBody);
    if (field) queryParams.append('field', field);
    if (status) queryParams.append('status', status);
    
    // Thêm tham số phân trang
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const requestUrl = `${API_URL}/legal/documents?${queryParams.toString()}`;
    
    const response = await axios.get(requestUrl, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản pháp luật:', error);
    if (error.response) {
      console.error('Chi tiết lỗi từ server:', error.response.status, error.response.data);
    }
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
    console.log(`Gửi request lấy chi tiết văn bản ID=${id}`);
    const response = await axios.get(`${API_URL}/legal/documents/${id}`, getHeaders());
    console.log(`Nhận response chi tiết văn bản:`, response.status);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin văn bản ID=${id}:`, error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.status, error.response.data);
    }
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
 * Lấy danh sách cơ quan ban hành
 * @returns {Promise<Array>} Danh sách cơ quan ban hành
 */
const getIssuingBodies = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/issuing-bodies`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cơ quan ban hành:', error);
    throw error;
  }
};

/**
 * Lấy danh sách lĩnh vực pháp luật
 * @returns {Promise<Array>} Danh sách lĩnh vực
 */
const getLegalFields = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/fields`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lĩnh vực pháp luật:', error);
    throw error;
  }
};

/**
 * Lấy danh sách trạng thái hiệu lực
 * @returns {Promise<Array>} Danh sách trạng thái hiệu lực
 */
const getEffectStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/effect-status`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách trạng thái hiệu lực:', error);
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
 * @param {string} searchParams.type - Loại văn bản
 * @param {string} searchParams.fromDate - Từ ngày (định dạng YYYY-MM-DD)
 * @param {string} searchParams.toDate - Đến ngày (định dạng YYYY-MM-DD)
 * @param {string} searchParams.language - Ngôn ngữ mẫu văn bản
 * @param {number} searchParams.page - Trang hiện tại
 * @param {number} searchParams.limit - Số kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm tổng hợp
 */
const searchAll = async (searchParams = {}) => {
  try {
    const { 
      q = '', 
      type = '',
      fromDate = null,
      toDate = null,
      language = '',
      page = 1, 
      limit = 10 
    } = searchParams;
    
    const queryParams = new URLSearchParams();
    queryParams.append('q', q); // Luôn gửi tham số q, ngay cả khi là chuỗi trống
    
    // Thêm các tham số lọc nếu có
    if (type) queryParams.append('type', type);
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);
    if (language) queryParams.append('language', language);
    
    // Thêm tham số phân trang
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const requestUrl = `${API_URL}/legal/search?${queryParams.toString()}`;
    console.log(`Gửi request tìm kiếm tổng hợp: ${requestUrl}`);
    
    const response = await axios.get(requestUrl, getHeaders());
    console.log('Nhận được response với status:', response.status);
    console.log('Dữ liệu phân trang từ server:', response.data.pagination);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tổng hợp:', error);
    if (error.response) {
      console.error('Chi tiết lỗi từ server:', error.response.status, error.response.data);
    }
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
  searchAll,
  getIssuingBodies,
  getLegalFields,
  getEffectStatus
}; 