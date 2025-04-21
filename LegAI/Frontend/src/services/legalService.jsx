import axios from '../config/axios';
import { API_URL } from '../config/constants';

/**
 * Service để tương tác với API văn bản pháp luật
 */

// Lấy token xác thực từ localStorage (nếu có)
const getToken = () => {
  return localStorage.getItem('token');
};

// Cấu hình headers cho request
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
};

/**
 * Lấy danh sách văn bản pháp luật với tùy chọn tìm kiếm
 * @param {Object} searchParams - Tham số tìm kiếm
 * @returns {Promise} Promise chứa kết quả tìm kiếm
 */
const getLegalDocuments = async (searchParams = {}) => {
  try {
    const { search, document_type, from_date, to_date, page = 1, limit = 10 } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (document_type) queryParams.append('document_type', document_type);
    if (from_date) queryParams.append('from_date', from_date);
    if (to_date) queryParams.append('to_date', to_date);
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
 * Lấy chi tiết văn bản pháp luật theo ID
 * @param {string|number} id - ID của văn bản
 * @returns {Promise} Promise chứa thông tin chi tiết văn bản
 */
const getLegalDocumentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/legal/documents/${id}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết văn bản có ID ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách loại văn bản pháp luật
 * @returns {Promise} Promise chứa danh sách loại văn bản
 */
const getDocumentTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/document-types`, getHeaders());
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại văn bản:', error);
    throw error;
  }
};

/**
 * Lấy danh sách cơ quan ban hành
 * @returns {Promise} Promise chứa danh sách cơ quan ban hành
 */
const getIssuingBodies = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/issuing-bodies`, getHeaders());
    return response.data.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cơ quan ban hành:', error);
    throw error;
  }
};

/**
 * Lấy danh sách mẫu văn bản với tùy chọn tìm kiếm
 * @param {Object} searchParams - Tham số tìm kiếm
 * @returns {Promise} Promise chứa kết quả tìm kiếm
 */
const getDocumentTemplates = async (searchParams = {}) => {
  try {
    const { search, template_type, page = 1, limit = 10 } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (template_type) queryParams.append('template_type', template_type);
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
 * Lấy chi tiết mẫu văn bản theo ID
 * @param {string|number} id - ID của mẫu văn bản
 * @returns {Promise} Promise chứa thông tin chi tiết mẫu văn bản
 */
const getDocumentTemplateById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/legal/templates/${id}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết mẫu văn bản có ID ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách loại mẫu văn bản
 * @returns {Promise} Promise chứa danh sách loại mẫu văn bản
 */
const getTemplateTypes = async () => {
  try {
    console.log('Đang gọi API lấy loại mẫu văn bản');
    const response = await axios.get(`${API_URL}/legal/template-types`, getHeaders());
    console.log('Kết quả API loại mẫu văn bản:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', error);
    // Trả về mảng rỗng nếu có lỗi để xử lý phía client
    return [];
  }
};

/**
 * Thực hiện tìm kiếm tổng hợp (cả văn bản pháp luật và mẫu văn bản)
 * @param {Object} searchParams - Tham số tìm kiếm
 * @returns {Promise} Promise chứa kết quả tìm kiếm
 */
const searchAll = async (searchParams = {}) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10,
      document_type,
      from_date,
      to_date,
      language
    } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Thêm các tham số tìm kiếm mở rộng
    if (document_type) queryParams.append('document_type', document_type);
    if (from_date) queryParams.append('from_date', from_date);
    if (to_date) queryParams.append('to_date', to_date);
    if (language) queryParams.append('language', language);

    const response = await axios.get(`${API_URL}/legal/search?${queryParams.toString()}`, getHeaders());
    console.log('API search URL:', `${API_URL}/legal/search?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tổng hợp:', error);
    throw error;
  }
};

export default {
  getLegalDocuments, 
  getLegalDocumentById,
  getDocumentTypes,
  getIssuingBodies,
  getDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll
}; 