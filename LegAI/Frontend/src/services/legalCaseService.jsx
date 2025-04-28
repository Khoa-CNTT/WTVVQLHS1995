import axios from '../config/axios';
import { API_URL } from '../config/constants';

// Lấy token từ localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Cấu hình headers với token
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Tạo vụ án pháp lý mới
 * @param {FormData} formData - Dữ liệu vụ án (bao gồm file)
 * @returns {Promise<Object>} Kết quả tạo vụ án
 */
export const createLegalCase = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/legal-cases`, formData, {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
      timeout: 30000 // Tăng timeout lên 30 giây
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo vụ án:', error);
    
    // Nếu không thể kết nối đến server hoặc server không phản hồi
    if (!error.response) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
      };
    }
    
    // Trả về thông tin lỗi từ server nếu có
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // Trường hợp khác
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tạo vụ án. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Lấy danh sách vụ án của người dùng hiện tại
 * @param {Object} params - Tham số tìm kiếm
 * @returns {Promise<Object>} Danh sách vụ án
 */
export const getLegalCases = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Thêm các tham số tìm kiếm vào URL
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `${API_URL}/legal-cases?${queryParams.toString()}`;
    const response = await axios.get(url, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Lấy chi tiết vụ án theo ID
 * @param {number} caseId - ID vụ án
 * @returns {Promise<Object>} Chi tiết vụ án
 */
export const getLegalCaseById = async (caseId) => {
  try {
    const response = await axios.get(`${API_URL}/legal-cases/${caseId}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Tạo bản nháp bằng AI
 * @param {Object} draftData - Dữ liệu cho AI
 * @returns {Promise<Object>} Kết quả bản nháp
 */
export const createAIDraft = async (draftData) => {
  try {
    const response = await axios.post(`${API_URL}/legal-cases/ai-draft`, draftData, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo bản nháp AI:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Gán vụ án cho luật sư
 * @param {number} caseId - ID vụ án
 * @param {number} lawyerId - ID luật sư
 * @returns {Promise<Object>} Kết quả gán luật sư
 */
export const assignLawyer = async (caseId, lawyerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/legal-cases/${caseId}/assign-lawyer`,
      { lawyer_id: lawyerId },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gán luật sư cho vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Tính phí vụ án
 * @param {number} caseId - ID vụ án
 * @param {Object} parameters - Tham số tính phí
 * @returns {Promise<Object>} Kết quả tính phí
 */
export const calculateFee = async (caseId, parameters = {}) => {
  try {
    const response = await axios.post(
      `${API_URL}/legal-cases/${caseId}/calculate-fee`,
      { parameters },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tính phí vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Tạo giao dịch thanh toán
 * @param {number} caseId - ID vụ án
 * @param {string} paymentMethod - Phương thức thanh toán
 * @returns {Promise<Object>} Kết quả tạo giao dịch
 */
export const createPayment = async (caseId, paymentMethod) => {
  try {
    const response = await axios.post(
      `${API_URL}/legal-cases/${caseId}/payment`,
      { payment_method: paymentMethod },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Tải xuống tài liệu vụ án
 * @param {number} caseId - ID vụ án
 * @param {number} documentId - ID tài liệu
 * @returns {Promise<Blob>} File tài liệu
 */
export const downloadDocument = async (caseId, documentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/legal-cases/${caseId}/documents/${documentId}`,
      {
        ...getHeaders(),
        responseType: 'blob'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tải xuống tài liệu:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Lấy danh sách loại vụ án
 * @returns {Promise<Object>} Danh sách loại vụ án
 */
export const getCaseTypes = async () => {
  // Trả về dữ liệu mặc định trực tiếp mà không gọi API
  return {
    success: true,
    message: 'Danh sách loại vụ án mặc định',
    data: [
      { case_type: 'Dân sự', description: 'Tranh chấp dân sự, hợp đồng, đất đai' },
      { case_type: 'Hình sự', description: 'Bào chữa, tư vấn các vụ án hình sự' },
      { case_type: 'Hành chính', description: 'Khiếu nại, tố cáo hành chính' },
      { case_type: 'Lao động', description: 'Tranh chấp lao động, hợp đồng lao động' },
      { case_type: 'Hôn nhân gia đình', description: 'Ly hôn, phân chia tài sản, nuôi con' },
      { case_type: 'Kinh doanh thương mại', description: 'Tranh chấp thương mại, doanh nghiệp' },
      { case_type: 'Sở hữu trí tuệ', description: 'Bản quyền, nhãn hiệu, sáng chế' }
    ]
  };
};

/**
 * Cập nhật thông tin vụ án
 * @param {number} caseId - ID vụ án
 * @param {FormData} formData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const updateLegalCase = async (caseId, formData) => {
  try {
    const response = await axios.put(`${API_URL}/legal-cases/${caseId}`, formData, {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data'
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Xóa vụ án
 * @param {number} caseId - ID vụ án
 * @returns {Promise<Object>} Kết quả xóa
 */
export const deleteLegalCase = async (caseId) => {
  try {
    const response = await axios.delete(`${API_URL}/legal-cases/${caseId}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

export default {
  createLegalCase,
  getLegalCases,
  getLegalCaseById,
  createAIDraft,
  assignLawyer,
  calculateFee,
  createPayment,
  downloadDocument,
  getCaseTypes,
  updateLegalCase,
  deleteLegalCase
}; 