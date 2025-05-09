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
    // Kiểm tra và đảm bảo kết quả trả về là mảng
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Định dạng dữ liệu không đúng từ API document-types:', response.data);
      return []; // Trả về mảng rỗng nếu không phải mảng
    }
  } catch (error) {
    console.warn('Lỗi khi lấy danh sách loại văn bản:', error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};

/**
 * Lấy danh sách cơ quan ban hành
 * @returns {Promise} Promise chứa danh sách cơ quan ban hành
 */
const getIssuingBodies = async () => {
  try {
    const response = await axios.get(`${API_URL}/legal/issuing-bodies`, getHeaders());
    return response.data;
  } catch (error) {
    return [];
  }
};

/**
 * Lấy danh sách mẫu văn bản với tùy chọn tìm kiếm
 * @param {Object} searchParams - Tham số tìm kiếm
 * @returns {Promise} Promise chứa kết quả tìm kiếm
 */
const getDocumentTemplates = async (searchParams = {}) => {
  try {
    const { 
      search, 
      template_type, 
      page = 1, 
      limit = 10 
    } = searchParams;
    
    // Xây dựng query string
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (template_type) queryParams.append('template_type', template_type);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/legal/templates?${queryParams.toString()}`, getHeaders());
    return response.data;
  } catch (error) {
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
      // Giữ nguyên từ khóa tìm kiếm để đảm bảo tìm kiếm chính xác
      // Không chuyển đổi sang chữ thường hoặc xóa khoảng trắng để giữ nguyên định dạng chính xác
      queryParams.append('search', search);
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
      // Thử tìm kiếm chính xác theo số hiệu văn bản
      // Các văn bản pháp luật thường có dạng: số/năm/ký hiệu
      if (/\d+\/\d{4}\//.test(search)) {
        // Xử lý đặc biệt cho tìm kiếm số hiệu văn bản
        const exactSearchParams = new URLSearchParams();
        exactSearchParams.append('search', search.trim());
        exactSearchParams.append('page', 1);
        exactSearchParams.append('limit', 10);
        
        const exactResult = await axios.get(`${API_URL}/legal/documents?${exactSearchParams.toString()}`, getHeaders());
        if (exactResult.data && exactResult.data.data && exactResult.data.data.length > 0) {
          return exactResult.data;
        }
      }
      
      // Nếu từ khóa có nhiều từ, thử tìm kiếm với từng từ riêng lẻ
      if (search.includes(' ')) {
        // Tách từ khóa thành các từ riêng lẻ, loại bỏ từ quá ngắn
        const keywords = search.split(/\s+/).filter(word => word.length > 1);
        
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
          
          // Sắp xếp lại kết quả: ưu tiên các văn bản có tiêu đề chứa nhiều từ khóa nhất
          if (allResults.length > 0) {
            // Tính điểm cho mỗi kết quả
            const scoredResults = allResults.map(item => {
              const title = (item.title || '').toLowerCase();
              
              // Tính số từ khóa xuất hiện trong tiêu đề
              let titleKeywordMatches = 0;
              keywords.forEach(keyword => {
                if (title.includes(keyword.toLowerCase())) {
                  titleKeywordMatches++;
                }
              });
              
              // Điểm cao nhất cho các kết quả có nhiều từ khóa trong tiêu đề
              const score = titleKeywordMatches * 10 - (item.result_type === 'template' ? 5 : 0);
              
              return { ...item, score };
            });
            
            // Sắp xếp theo điểm từ cao xuống thấp
            scoredResults.sort((a, b) => b.score - a.score);
            
            // Loại bỏ trường score trước khi trả về
            const rankedResults = scoredResults.map(({ score, ...rest }) => rest);
            
            return {
              status: 'success',
              data: rankedResults,
              pagination: {
                currentPage: 1,
                totalPages: Math.ceil(rankedResults.length / limit),
                total: rankedResults.length,
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
          // Sắp xếp lại kết quả: ưu tiên các kết quả có tiêu đề gần giống nhất với từ khóa gốc
          const originalSearch = search.toLowerCase();
          
          const rankedResults = partialResult.data.data.map(item => {
            const title = (item.title || '').toLowerCase();
            
            // Tính điểm tương đồng giữa tiêu đề và từ khóa gốc
            let similarityScore = 0;
            
            // Điểm cao nhất nếu tiêu đề chứa chính xác từ khóa
            if (title.includes(originalSearch)) {
              similarityScore = 100;
            } 
            // Điểm cao nếu tiêu đề bắt đầu bằng từ khóa
            else if (title.startsWith(partialSearch)) {
              similarityScore = 80;
            }
            // Điểm trung bình nếu tiêu đề chứa từ khóa một phần
            else if (title.includes(partialSearch)) {
              similarityScore = 50;
            }
            // Điểm thấp cho các trường hợp khác
            else {
              similarityScore = 10;
            }
            
            return { ...item, _score: similarityScore };
          });
          
          // Sắp xếp theo điểm tương đồng từ cao xuống thấp
          rankedResults.sort((a, b) => b._score - a._score);
          
          // Loại bỏ trường _score trước khi trả về
          const finalResults = rankedResults.map(({ _score, ...rest }) => rest);
          
          return {
            ...partialResult.data,
            data: finalResults
          };
        }
      }
    }
    
    return response.data;
  } catch (error) {
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