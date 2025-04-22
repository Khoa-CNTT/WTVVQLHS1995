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
    const { 
      search, 
      document_type, 
      from_date, 
      to_date, 
      page = 1, 
      limit = 10,
      case_insensitive = true  // Mặc định sử dụng tìm kiếm không phân biệt hoa thường
    } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (document_type) queryParams.append('document_type', document_type);
    if (from_date) queryParams.append('from_date', from_date);
    if (to_date) queryParams.append('to_date', to_date);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (case_insensitive) queryParams.append('case_insensitive', 'true');

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
    const response = await axios.get(`${API_URL}/legal/template-types`, getHeaders());
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
      limit = 50, // Tăng giới hạn mặc định lên 50
      document_type,
      from_date,
      to_date,
      language
    } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) {
      // Chuyển đổi từ khóa tìm kiếm thành chữ thường và loại bỏ dấu cách thừa
      const normalizedSearch = search.toLowerCase().trim();
      queryParams.append('search', normalizedSearch);
    }
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Thêm các tham số tìm kiếm mở rộng
    if (document_type) queryParams.append('document_type', document_type);
    if (from_date) queryParams.append('from_date', from_date);
    if (to_date) queryParams.append('to_date', to_date);
    if (language) queryParams.append('language', language);

    const response = await axios.get(`${API_URL}/legal/search?${queryParams.toString()}`, getHeaders());
    
    // Nếu không tìm thấy kết quả nào và từ khóa tìm kiếm có độ dài > 0, thử tìm kiếm mở rộng
    if (response.data && response.data.data && response.data.data.length === 0 && search && search.length > 0) {
      
      // Nếu từ khóa có nhiều từ, thử tìm kiếm với từng từ riêng lẻ
      if (search.includes(' ')) {
        // Tách từ khóa thành các từ riêng lẻ, loại bỏ từ quá ngắn
        const keywords = search.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        
        if (keywords.length > 0) {
          
          // Tìm kiếm song song với từng từ khóa
          const searchPromises = keywords.map(keyword => {
            const newParams = new URLSearchParams();
            newParams.append('search', keyword);
            newParams.append('page', 1);
            newParams.append('limit', 20);
            
            if (document_type) newParams.append('document_type', document_type);
            if (from_date) newParams.append('from_date', from_date);
            if (to_date) newParams.append('to_date', to_date);
            if (language) newParams.append('language', language);
            
            return axios.get(`${API_URL}/legal/search?${newParams.toString()}`, getHeaders());
          });
          
          // Chờ tất cả các yêu cầu tìm kiếm hoàn thành
          const results = await Promise.all(searchPromises);
          
          // Gộp kết quả và loại bỏ trùng lặp
          const allResults = [];
          const seenIds = new Set();
          
          results.forEach(result => {
            if (result.data && result.data.data) {
              result.data.data.forEach(item => {
                if (!seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  allResults.push(item);
                }
              });
            }
          });
          
          // Nếu tìm thấy kết quả, trả về dữ liệu tổng hợp
          if (allResults.length > 0) {
            console.log(`Tìm thấy ${allResults.length} kết quả khi mở rộng tìm kiếm theo từng từ`);
            return {
              status: 'success',
              data: allResults,
              pagination: {
                currentPage: 1,
                totalPages: Math.ceil(allResults.length / limit),
                total: allResults.length,
                limit: limit
              }
            };
          }
        }
      }
      
      // Nếu từ khóa là một từ duy nhất và dài hơn 3 ký tự, thử tìm kiếm với một phần của từ
      if (!search.includes(' ') && search.length > 3) {
        // Lấy một phần đầu của từ khóa để tìm kiếm mở rộng
        const partialSearch = search.substring(0, Math.max(3, Math.floor(search.length * 0.7)));
        console.log('Thử tìm kiếm với một phần của từ khóa:', partialSearch);
        
        const newParams = new URLSearchParams();
        newParams.append('search', partialSearch);
        newParams.append('page', 1);
        newParams.append('limit', 30);
        
        if (document_type) newParams.append('document_type', document_type);
        if (from_date) newParams.append('from_date', from_date);
        if (to_date) newParams.append('to_date', to_date);
        if (language) newParams.append('language', language);
        
        const partialResult = await axios.get(`${API_URL}/legal/search?${newParams.toString()}`, getHeaders());
        
        if (partialResult.data && partialResult.data.data && partialResult.data.data.length > 0) {
          console.log(`Tìm thấy ${partialResult.data.data.length} kết quả khi tìm kiếm với một phần từ khóa`);
          return partialResult.data;
        }
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tổng hợp:', error);
    throw error;
  }
};

/**
 * Tải xuống văn bản pháp luật dưới dạng PDF
 * @param {string|number} id - ID của văn bản
 */
const downloadLegalDocument = async (id) => {
  try {
    // Tạo URL tải xuống
    const downloadUrl = `${API_URL}/legal/documents/${id}/download`;
    
    // Mở URL trong tab mới để tải xuống
    window.open(downloadUrl, '_blank');
  } catch (error) {
    console.error(`Lỗi khi tải xuống văn bản có ID ${id}:`, error);
    throw error;
  }
};

/**
 * Tải xuống mẫu văn bản dưới dạng PDF
 * @param {string|number} id - ID của mẫu văn bản
 */
const downloadDocumentTemplate = async (id) => {
  try {
    // Tạo URL tải xuống
    const downloadUrl = `${API_URL}/legal/templates/${id}/download`;
    
    // Mở URL trong tab mới để tải xuống
    window.open(downloadUrl, '_blank');
  } catch (error) {
    console.error(`Lỗi khi tải xuống mẫu văn bản có ID ${id}:`, error);
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
  searchAll,
  downloadLegalDocument,
  downloadDocumentTemplate
}; 