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
    // In ra thông tin formData để debug
    console.log('FormData được gửi đi:');
    for (let [key, value] of formData.entries()) {
      // Không in nội dung file vì quá dài
      if (key === 'file') {
        console.log(`${key}: [File object]`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    const response = await axios.post(`${API_URL}/legal-cases`, formData, {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
      timeout: 60000 // Tăng timeout lên 60 giây vì có thể có file lớn
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
    // Kiểm tra caseId có hợp lệ không
    if (!caseId || caseId === 'undefined' || caseId === 'null' || caseId === 'all') {
      console.error('ID vụ án không hợp lệ:', caseId);
      return {
        success: false,
        message: 'ID vụ án không hợp lệ',
        data: null
      };
    }
    
    // Kiểm tra ID là số nguyên hợp lệ
    const caseIdInt = parseInt(caseId, 10);
    if (isNaN(caseIdInt)) {
      console.error('ID vụ án không phải là số hợp lệ:', caseId);
      return {
        success: false,
        message: 'ID vụ án không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.get(`${API_URL}/legal-cases/${caseIdInt}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết vụ án:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể lấy thông tin vụ án',
        data: null
      };
    }
    
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      data: null
    };
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
    // Chuyển đổi lawyerId thành số nếu nó là chuỗi
    const parsedLawyerId = typeof lawyerId === 'string' ? parseInt(lawyerId, 10) : lawyerId;
    
    if (isNaN(parsedLawyerId)) {
      return {
        success: false,
        message: 'ID luật sư không hợp lệ'
      };
    }
    
    const response = await axios.post(
      `${API_URL}/legal-cases/${caseId}/assign-lawyer`,
      { lawyer_id: parsedLawyerId },
      getHeaders()
    );
    
    // Đảm bảo kết quả trả về luôn có cấu trúc nhất quán
    if (response.data && response.data.success) {
      return response.data;
    } else {
      return {
        success: true,
        message: 'Đã gán luật sư thành công',
        data: response.data
      };
    }
  } catch (error) {
    console.error('Lỗi khi gán luật sư cho vụ án:', error);
    
    // Kiểm tra xem luật sư đã được gán vào vụ án chưa, ngay cả khi có lỗi xảy ra
    // (đôi khi lỗi xảy ra ở bước tạo lịch hẹn nhưng vụ án đã được gán thành công)
    try {
      const caseResponse = await axios.get(`${API_URL}/legal-cases/${caseId}`, getHeaders());
      if (caseResponse.data && caseResponse.data.success && 
          caseResponse.data.data && caseResponse.data.data.lawyer_id) {
        // Nếu vụ án đã được gán luật sư thành công
        return {
          success: true,
          message: 'Đã gán luật sư thành công, nhưng có lỗi khi tạo lịch hẹn',
          data: caseResponse.data.data,
          partial_success: true
        };
      }
    } catch (checkError) {
      console.error('Lỗi khi kiểm tra trạng thái vụ án:', checkError);
      // Tiếp tục xử lý lỗi ban đầu
    }
    
    // Trả về thông tin lỗi có cấu trúc
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    };
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
    // Kiểm tra token trước khi gọi API
    const token = getToken();
    if (!token) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện tính phí'
      };
    }

    // Lấy thông tin người dùng hiện tại
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Gửi yêu cầu tính phí với tham số:', parameters);
    console.log('Thông tin người dùng gửi yêu cầu:', {
      id: userData.id,
      role: userData.role
    });

    // Trước khi tính phí, kiểm tra trực tiếp xem người dùng có phải là luật sư được gán cho vụ án không
    try {
      // Lấy thông tin vụ án hiện tại
      const caseResponse = await axios.get(
        `${API_URL}/legal-cases/${caseId}`, 
        getHeaders()
      );
      
      if (caseResponse.data && caseResponse.data.success && caseResponse.data.data) {
        const caseInfo = caseResponse.data.data;
        
        // Lấy ID luật sư được gán
        const assignedLawyerId = caseInfo.lawyer?.id;
        
        // So sánh ID luật sư được gán với ID người dùng hiện tại
        // Chuyển cả hai ID thành chuỗi để đảm bảo so sánh chính xác
        const isExactAssignedLawyer = 
          assignedLawyerId && 
          userData.id && 
          String(assignedLawyerId) === String(userData.id);
        
        // Nếu không phải luật sư được gán cho vụ án này, từ chối quyền
        if (!isExactAssignedLawyer) {
          console.log('Người dùng không phải luật sư được gán cho vụ án:', {
            userId: userData.id,
            assignedLawyerId
          });
          
          return {
            success: false,
            message: 'Chỉ luật sư được gán cho vụ án này mới có quyền tính phí.',
            permissionError: true
          };
        }
        
        console.log('Xác thực quyền tính phí thành công:', {
          userId: userData.id,
          assignedLawyerId,
          isExactAssignedLawyer: true
        });
      }
    } catch (checkError) {
      console.error('Lỗi khi kiểm tra quyền tính phí:', checkError);
      // Nếu không thể kiểm tra, từ chối luôn để đảm bảo an toàn
      return {
        success: false,
        message: 'Không thể xác thực quyền hạn, vui lòng thử lại sau',
        permissionError: true
      };
    }

    // Tạo dữ liệu gửi đi với thông tin bổ sung về người dùng
    const requestData = {
      parameters,
      lawyer_id: userData.id    // Gửi ID luật sư để backend xác thực
    };

    const response = await axios.post(
      `${API_URL}/legal-cases/${caseId}/calculate-fee`,
      requestData,
      getHeaders()
    );
    
    console.log('Phản hồi từ API tính phí:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tính phí vụ án:', error);
    
    // Kiểm tra và xử lý các loại lỗi
    if (!error.response) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng'
      };
    }
    
    // Lỗi xác thực
    if (error.response.status === 401) {
      return {
        success: false,
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        authError: true
      };
    }
    
    // Lỗi quyền truy cập
    if (error.response.status === 403) {
      return {
        success: false,
        message: 'Bạn không có quyền thực hiện tính phí cho vụ án này. Chỉ luật sư được gán cho vụ án mới có quyền tính phí.',
        permissionError: true
      };
    }
    
    // Các lỗi khác từ server
    if (error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Có lỗi xảy ra khi tính phí vụ án',
        error: error.response.data
      };
    }
    
    // Lỗi không xác định
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi tính phí vụ án',
      error: error.message
    };
  }
};

/**
 * Tính phí pháp lý tự động dựa trên loại vụ án và thông tin
 * @param {Object} caseData - Thông tin vụ án
 * @returns {Promise<Object>} Kết quả tính phí
 */
export const calculateLegalFeeAutomatic = async (caseData) => {
  try {
    if (!caseData) {
      return {
        success: false,
        message: 'Không có dữ liệu vụ án',
        data: null
      };
    }
    
    // Biểu phí cơ bản theo loại vụ án
    const baseFees = {
      'Dân sự': 3000000,
      'Hình sự': 5000000,
      'Hành chính': 2500000,
      'Lao động': 2000000,
      'Hôn nhân gia đình': 2500000,
      'Kinh doanh thương mại': 4000000,
      'Sở hữu trí tuệ': 4500000,
      'default': 3000000 // Phí mặc định nếu không xác định được loại vụ án
    };
    
    // Hệ số phức tạp: dựa trên độ dài nội dung văn bản, số từ, thời gian tạo
    let complexityFactor = 1.0;
    
    // Tính độ phức tạp dựa trên độ dài nội dung
    if (caseData.ai_content) {
      const contentLength = caseData.ai_content.length;
      if (contentLength > 10000) complexityFactor += 0.5;
      else if (contentLength > 5000) complexityFactor += 0.3;
      else if (contentLength > 2000) complexityFactor += 0.1;
    }
    
    // Các trường hợp đặc biệt
    if (caseData.file_url) {
      // Nếu có file đính kèm, tăng độ phức tạp
      complexityFactor += 0.2;
    }
    
    // Tính phí cơ bản dựa trên loại vụ án
    const basePrice = baseFees[caseData.case_type] || baseFees.default;
    
    // Tính tổng phí
    const totalFee = Math.round(basePrice * complexityFactor);
    
    // Miễn phí phân tích sơ bộ
    const preliminaryAnalysisFee = 0;
    
    // Kết quả tính phí
    return {
      success: true,
      data: {
        base_fee: basePrice,
        complexity_factor: complexityFactor,
        preliminary_analysis_fee: preliminaryAnalysisFee,
        legal_consulting_fee: totalFee,
        total_fee: totalFee + preliminaryAnalysisFee,
        currency: 'VND',
        fee_details: [
          { name: 'Phí tư vấn pháp lý', amount: totalFee },
          { name: 'Phí phân tích sơ bộ', amount: preliminaryAnalysisFee }
        ]
      }
    };
  } catch (error) {
    console.error('Lỗi khi tính phí pháp lý tự động:', error);
    return {
      success: false,
      message: 'Không thể tính phí pháp lý tự động',
      data: null
    };
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
    // Kiểm tra token
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để thanh toán'
      };
    }

    // Kiểm tra tham số đầu vào
    if (!caseId) {
      return {
        success: false,
        message: 'Thiếu thông tin ID vụ án'
      };
    }

    // Trước tiên, lấy thông tin chi tiết vụ án để có số tiền phí
    const caseDetails = await getLegalCaseById(caseId);
    if (!caseDetails || !caseDetails.success) {
      return {
        success: false,
        message: 'Không thể lấy thông tin vụ án'
      };
    }

    // Kiểm tra xem vụ án có thông tin phí không
    if (!caseDetails.data.fee_amount || caseDetails.data.fee_amount <= 0) {
      return {
        success: false,
        message: 'Vụ án chưa được tính phí hoặc số tiền không hợp lệ'
      };
    }

    // Lấy thông tin người dùng
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Chuẩn bị dữ liệu giao dịch
    const transactionData = {
      case_id: caseId,
      payment_method: paymentMethod || 'bank_transfer',
      user_id: userData.id,
      amount: caseDetails.data.fee_amount
    };

    console.log('Tạo giao dịch thanh toán với dữ liệu:', transactionData);

    // Gọi API tạo giao dịch
    const response = await axios.post(`${API_URL}/transactions`, transactionData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Kết quả tạo giao dịch:', response.data);

    if (response.data.success) {
      // Cập nhật trạng thái vụ án thành đang chờ thanh toán
      try {
        // Gọi API cập nhật trạng thái vụ án sang đang chờ thanh toán
        const caseUpdateResponse = await axios.patch(
          `${API_URL}/legal-cases/${caseId}/status`,
          { 
            status: 'pending',
            payment_status: 'pending' 
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        console.log('Cập nhật trạng thái vụ án:', caseUpdateResponse.data);
      } catch (updateError) {
        console.error('Lỗi khi cập nhật trạng thái vụ án:', updateError);
        // Không ảnh hưởng đến việc trả về kết quả tạo giao dịch
      }
    }

    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể tạo giao dịch thanh toán'
      };
    }
    
    return {
      success: false,
      message: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Tải xuống tài liệu vụ án
 * @param {number} caseId - ID vụ án
 * @returns {Promise<Blob>} File tài liệu
 */
export const downloadDocument = async (caseId) => {
  try {
    const response = await axios.get(
      `${API_URL}/legal-cases/${caseId}/download`,
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
 * Trích xuất nội dung từ file binary (PDF, DOCX)
 * @param {FormData} formData - FormData chứa file cần trích xuất nội dung
 * @returns {Promise<Object>} Kết quả trích xuất nội dung
 */
export const extractFileContent = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}/legal-cases/extract-content`,
      formData,
      {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi trích xuất nội dung file:', error);
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
    // In ra thông tin formData để debug
    console.log('[FRONTEND] FormData gửi đi trong updateLegalCase:');
    for (let [key, value] of formData.entries()) {
      if (key === 'file') {
        console.log(`${key}: [File object]`);
      } else if (key === 'ai_content') {
        console.log(`${key}: [Nội dung với độ dài ${value.length}]`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    const response = await axios.put(`${API_URL}/legal-cases/${caseId}`, formData, {
      ...getHeaders(),
      headers: {
        ...getHeaders().headers,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // Tăng timeout lên 60s cho file lớn
    });
    
    console.log('[FRONTEND] Kết quả cập nhật vụ án:', response.data);
    return response.data;
  } catch (error) {
    console.error('[FRONTEND] Lỗi khi cập nhật vụ án:', error);
    
    // Thông tin lỗi chi tiết
    if (error.response) {
      console.error('[FRONTEND] Response error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('[FRONTEND] Request error - không nhận được phản hồi');
    } else {
      console.error('[FRONTEND] Error message:', error.message);
    }
    
    // Trả về thông tin lỗi từ server nếu có
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // Trường hợp khác
    return {
      success: false,
      message: 'Không thể cập nhật vụ án. Vui lòng thử lại sau.'
    };
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

/**
 * Lấy danh sách vụ án được gán cho luật sư
 * @param {Object} params - Tham số tìm kiếm
 * @returns {Promise<Object>} Danh sách vụ án
 */
export const getLawyerCases = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Thêm các tham số tìm kiếm vào URL
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `${API_URL}/legal-cases/lawyer-cases?${queryParams.toString()}`;
    const response = await axios.get(url, {
      ...getHeaders(),
      timeout: 30000 // Tăng timeout lên 30 giây
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án của luật sư:', error);
    
    // Nếu không thể kết nối đến server hoặc server không phản hồi
    if (!error.response) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        data: []
      };
    }
    
    // Trả về thông tin lỗi từ server nếu có
    if (error.response && error.response.data) {
      return {
        ...error.response.data,
        data: []
      };
    }
    
    // Trường hợp khác
    return {
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách vụ án. Vui lòng thử lại sau.',
      data: []
    };
  }
};

/**
 * Cập nhật trạng thái vụ án
 * @param {number} caseId - ID vụ án
 * @param {string} status - Trạng thái mới
 * @param {string} notes - Ghi chú bổ sung (tùy chọn)
 * @returns {Promise<Object>} Vụ án đã cập nhật
 */
export const updateCaseStatus = async (caseId, status, notes = '') => {
  try {
    const response = await axios.patch(
      `${API_URL}/legal-cases/${caseId}/status`,
      { status, notes },
      getHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái vụ án:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Lấy tài khoản ngân hàng mặc định của luật sư xử lý vụ án
 * @param {number} lawyerId ID của luật sư
 * @returns {Promise<Object>} Thông tin tài khoản ngân hàng mặc định
 */
export const getLawyerBankAccount = async (lawyerId) => {
  try {
    console.log('Gọi API lấy tài khoản ngân hàng cho luật sư ID:', lawyerId);
    
    // Kiểm tra lawyerId có hợp lệ không
    if (!lawyerId || isNaN(parseInt(lawyerId))) {
      console.error('ID luật sư không hợp lệ:', lawyerId);
      return {
        success: false,
        message: 'ID luật sư không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.get(
      `${API_URL}/users/lawyers/${lawyerId}/bank-account`,
      getHeaders()
    );
    
    console.log('Kết quả từ API tài khoản ngân hàng:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tài khoản ngân hàng:', error);
    
    // Trả về thông tin tài khoản mặc định của hệ thống
    const defaultAccount = {
      bank_name: 'Vietcombank',
      account_number: '1023456789',
      account_holder: 'CÔNG TY LEGAI',
      branch: 'Hà Nội',
      is_default: true
    };
    
    if (error.response) {
      console.error('Chi tiết lỗi API:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Nếu không tìm thấy tài khoản hoặc luật sư, trả về tài khoản mặc định
      if (error.response.status === 404) {
        return {
          success: true,
          message: 'Sử dụng tài khoản hệ thống mặc định',
          data: defaultAccount
        };
      }
    }
    
    // Trả về một object lỗi có cấu trúc
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể lấy thông tin tài khoản ngân hàng',
      error: error.message,
      data: defaultAccount // Vẫn cung cấp tài khoản mặc định trong trường hợp lỗi
    };
  }
};

// Hàm kiểm tra trạng thái thanh toán của vụ án
export const checkPaymentStatus = async (caseId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Bạn cần đăng nhập để xem trạng thái thanh toán'
      };
    }

    // Gọi API kiểm tra trạng thái thanh toán
    const response = await axios.get(`${API_URL}/legal-cases/${caseId}/payment-status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Kết quả kiểm tra trạng thái thanh toán:', response.data);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      return {
        success: false,
        data: null,
        message: response.data?.message || 'Không thể lấy thông tin thanh toán'
      };
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    return {
      success: false,
      data: null,
      message: 'Không thể kiểm tra trạng thái thanh toán'
    };
  }
};

/**
 * Lấy tất cả vụ án (dành cho admin)
 * @param {Object} params - Tham số tìm kiếm và phân trang
 * @returns {Promise<Object>} Danh sách tất cả vụ án
 */
export const getAllLegalCases = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Thêm các tham số tìm kiếm vào URL
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.case_type) queryParams.append('case_type', params.case_type);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const url = `${API_URL}/legal-cases/all?${queryParams.toString()}`;
    const response = await axios.get(url, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy tất cả vụ án:', error);
    
    // Nếu không có phản hồi từ server
    if (!error.response) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        data: [],
        total: 0
      };
    }
    
    // Nếu là lỗi xác thực hoặc quyền truy cập
    if (error.response.status === 401 || error.response.status === 403) {
      return {
        success: false,
        message: 'Bạn không có quyền truy cập vào chức năng này',
        data: [],
        total: 0
      };
    }
    
    // Lỗi khác từ server
    return {
      success: false,
      message: error.response.data?.message || 'Không thể lấy danh sách vụ án. Vui lòng thử lại sau.',
      data: [],
      total: 0
    };
  }
};

export default {
  createLegalCase,
  getLegalCases,
  getLegalCaseById,
  createAIDraft,
  assignLawyer,
  calculateFee,
  calculateLegalFeeAutomatic,
  createPayment,
  downloadDocument,
  extractFileContent,
  getCaseTypes,
  updateLegalCase,
  deleteLegalCase,
  getLawyerCases,
  updateCaseStatus,
  getLawyerBankAccount,
  checkPaymentStatus,
  getAllLegalCases
}; 