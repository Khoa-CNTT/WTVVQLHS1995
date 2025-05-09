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
 * Lấy danh sách giao dịch của luật sư
 * @param {Object} params - Tham số lọc và phân trang
 * @returns {Promise<Object>} Danh sách giao dịch
 */
export const getLawyerTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    // Kiểm tra vai trò từ localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Thông tin người dùng từ LocalStorage (getLawyerTransactions):', userData);
    
    const url = `${API_URL}/transactions/lawyer?${queryParams.toString()}`;
    console.log('Đang gọi API lấy giao dịch luật sư:', url);
    
    const headers = getHeaders();
    console.log('Headers request:', headers);
    
    // Làm mới token nếu cần thiết
    const token = getToken();
    if (!token) {
      console.error('Không tìm thấy token xác thực');
      return {
        success: false,
        message: 'Vui lòng đăng nhập lại để tiếp tục',
        data: {
          transactions: [],
          total: 0
        }
      };
    }
    
    // Tăng timeout để đảm bảo có đủ thời gian nhận dữ liệu trên mạng chậm
    const response = await axios.get(url, {
      ...headers,
      timeout: 15000 // 15 giây (thay vì mặc định 5 giây)
    });
    
    console.log('Kết quả API lấy giao dịch luật sư:', response.data);
    
    // Kiểm tra kết quả API
    if (response.data && Array.isArray(response.data.data?.transactions)) {
      console.log(`Số lượng giao dịch nhận được: ${response.data.data.transactions.length}`);
    } else if (response.data && response.data.success === false) {
      console.error('API trả về lỗi:', response.data.message);
    } else {
      console.warn('Cấu trúc dữ liệu API không đúng định dạng mong đợi:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch của luật sư:', error);
    
    if (error.response) {
      console.error('Chi tiết lỗi API:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Kiểm tra lỗi xác thực
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Lỗi xác thực hoặc quyền hạn:', error.response.data);
        return {
          success: false,
          message: 'Phiên làm việc đã hết hạn hoặc bạn không có quyền truy cập',
          data: {
            transactions: [],
            total: 0
          }
        };
      }
      
      // Lỗi từ máy chủ
      if (error.response.status >= 500) {
        return {
          success: false,
          message: 'Máy chủ gặp sự cố. Vui lòng thử lại sau',
          data: {
            transactions: [],
            total: 0
          }
        };
      }
    } else if (error.request) {
      // Lỗi không nhận được phản hồi từ máy chủ
      console.error('Không nhận được phản hồi từ máy chủ:', error.request);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng',
        data: {
          transactions: [],
          total: 0
        }
      };
    }
    
    return {
      success: false,
      message: 'Không thể lấy danh sách giao dịch. Vui lòng thử lại sau.',
      data: {
        transactions: [],
        total: 0
      }
    };
  }
};

/**
 * Lấy thống kê tài chính của luật sư
 * @param {Object} params - Tham số lọc thời gian
 * @returns {Promise<Object>} Thống kê tài chính
 */
export const getLawyerFinancialStats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `${API_URL}/transactions/lawyer/stats?${queryParams.toString()}`;
    const response = await axios.get(url, getHeaders());
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thống kê tài chính của luật sư:', error);
    throw error.response ? error.response.data : error;
  }
};

/**
 * Lấy chi tiết giao dịch
 * @param {number} transactionId - ID giao dịch
 * @returns {Promise<Object>} Chi tiết giao dịch
 */
export const getTransactionById = async (transactionId) => {
  try {
    // Kiểm tra transactionId có hợp lệ không
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null' || transactionId === 'all') {
      console.error('ID giao dịch không hợp lệ:', transactionId);
      return {
        success: false,
        message: 'ID giao dịch không hợp lệ',
        data: null
      };
    }
    
    // Kiểm tra ID là số nguyên hợp lệ
    const transactionIdInt = parseInt(transactionId, 10);
    if (isNaN(transactionIdInt)) {
      console.error('ID giao dịch không phải là số hợp lệ:', transactionId);
      return {
        success: false,
        message: 'ID giao dịch không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.get(
      `${API_URL}/transactions/${transactionIdInt}`,
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết giao dịch:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể lấy thông tin giao dịch',
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
 * Xác nhận thanh toán bởi luật sư
 * @param {number} transactionId - ID giao dịch
 * @param {Object} confirmData - Dữ liệu xác nhận
 * @param {Object} options - Tùy chọn request (timeout, v.v.)
 * @returns {Promise<Object>} Kết quả xác nhận
 */
export const confirmPaymentByLawyer = async (transactionId, confirmData = {}, options = {}) => {
  try {
    // Ghi log thông tin xác nhận
    console.log('Bắt đầu xác nhận thanh toán cho giao dịch:', transactionId);
    console.log('Dữ liệu xác nhận:', confirmData);
    
    // Kiểm tra ID giao dịch
    if (!transactionId || transactionId <= 0) {
      console.error('ID giao dịch không hợp lệ:', transactionId);
      return {
        success: false,
        message: 'ID giao dịch không hợp lệ hoặc không tồn tại'
      };
    }
    
    // Kiểm tra quyền
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isLawyer = userData.role && (userData.role.toLowerCase() === 'lawyer' || userData.role.toLowerCase() === 'luật sư');
    
    if (!isLawyer) {
      console.error('Người dùng không phải luật sư không thể xác nhận thanh toán');
      return {
        success: false,
        message: 'Chỉ luật sư mới có quyền xác nhận thanh toán'
      };
    }
    
    // Kiểm tra token
    const token = getToken();
    if (!token) {
      console.error('Không tìm thấy token xác thực');
      return {
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
      };
    }
    
    try {
      // Chuẩn bị dữ liệu xác nhận với các thông tin cần thiết
      const requestData = {
        ...confirmData,
        status: 'completed',
        confirmation_date: new Date().toISOString(),
        payment_status: 'completed',
        update_case_status: true  // Yêu cầu backend cập nhật trạng thái vụ án
      };
      
      // Gọi API xác nhận thanh toán với timeout dài hơn để xử lý các vấn đề mạng
      const response = await axios.patch(
        `${API_URL}/transactions/${transactionId}/confirm`,
        requestData,
        {
          ...getHeaders(),
          timeout: options.timeout || 20000 // Timeout 20 giây mặc định
        }
      );
      
      console.log('Kết quả xác nhận thanh toán thành công:', response.data);
      
      // Nếu có case_id, cập nhật thêm trạng thái vụ án nếu API xác nhận thanh toán chưa xử lý
      if (response.data.success && confirmData.case_id && confirmData.update_status) {
        try {
          // Thêm một API call để đảm bảo trạng thái vụ án cũng được cập nhật
          const caseUpdateResponse = await axios.patch(
            `${API_URL}/legal-cases/${confirmData.case_id}/status`,
            { 
              status: 'paid',  // Trạng thái chính
              payment_status: 'completed',  // Trạng thái thanh toán
              notes: confirmData.notes || `Thanh toán đã được xác nhận vào ${new Date().toLocaleString()}`
            },
            getHeaders()
          );
          
          console.log('Cập nhật trạng thái vụ án:', caseUpdateResponse.data);
        } catch (caseUpdateError) {
          console.error('Lỗi khi cập nhật thêm trạng thái vụ án:', caseUpdateError);
          // Không báo lỗi cho người dùng vì việc xác nhận thanh toán vẫn thành công
        }
      }
      
      return response.data;
    } catch (apiError) {
      console.error('Lỗi API khi xác nhận thanh toán:', apiError);
      
      // Xử lý lỗi API chi tiết
      if (apiError.response) {
        console.error('Chi tiết lỗi API khi xác nhận thanh toán:', {
          status: apiError.response.status,
          data: apiError.response.data
        });
        
        // Kiểm tra lỗi xác thực
        if (apiError.response.status === 401 || apiError.response.status === 403) {
          return {
            success: false,
            message: 'Bạn không có quyền xác nhận thanh toán này hoặc phiên đã hết hạn'
          };
        }
        
        // Trả về thông báo lỗi từ server
        return {
          success: false,
          message: apiError.response.data.message || 'Không thể xác nhận thanh toán'
        };
      }
      
      // Lỗi không có phản hồi từ server
      if (apiError.request) {
        return {
          success: false,
          message: 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
        };
      }
      
      throw apiError; // Ném lỗi để xử lý bởi catch bên ngoài
    }
  } catch (error) {
    console.error('Lỗi không xác định khi xác nhận thanh toán:', error);
    
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Tạo giao dịch thanh toán mới
 * @param {Object} transactionData - Dữ liệu giao dịch
 * @returns {Promise<Object>} Kết quả tạo giao dịch
 */
export const createTransaction = async (transactionData) => {
  try {
    const response = await axios.post(
      `${API_URL}/transactions`,
      transactionData,
      getHeaders()
    );
    
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
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Phương thức thanh toán có sẵn
 * @returns {Array} Danh sách phương thức thanh toán
 */
export const getPaymentMethods = () => {
  return [
    { id: 'credit_card', name: 'Thẻ tín dụng/Thẻ ghi nợ', icon: 'credit-card' },
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', icon: 'bank' },
    { id: 'e_wallet', name: 'Ví điện tử', icon: 'wallet' },
    { id: 'momo', name: 'MoMo', icon: 'mobile' },
    { id: 'zalopay', name: 'ZaloPay', icon: 'z' },
    { id: 'cash', name: 'Tiền mặt', icon: 'money-bill' }
  ];
};

/**
 * Lấy danh sách tài khoản ngân hàng của luật sư
 * @returns {Promise<Object>} Danh sách tài khoản ngân hàng
 */
export const getLawyerBankAccounts = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/users/bank-accounts`,
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tài khoản ngân hàng:', error);
    
    return {
      success: false,
      message: 'Không thể lấy danh sách tài khoản ngân hàng',
      data: []
    };
  }
};

/**
 * Thêm hoặc cập nhật tài khoản ngân hàng
 * @param {Object} bankData - Thông tin tài khoản ngân hàng
 * @returns {Promise<Object>} Kết quả thêm/cập nhật tài khoản
 */
export const addBankAccount = async (bankData) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    if (!bankData) {
      return {
        success: false,
        message: 'Không có dữ liệu tài khoản ngân hàng',
        data: null
      };
    }

    if (!bankData.bank_name || !bankData.account_number || !bankData.account_holder) {
      return {
        success: false,
        message: 'Thiếu thông tin bắt buộc: tên ngân hàng, số tài khoản hoặc tên chủ tài khoản',
        data: null
      };
    }

    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingAccounts = await getLawyerBankAccounts();
    
    if (existingAccounts.success && existingAccounts.data && Array.isArray(existingAccounts.data)) {
      const existingAccount = existingAccounts.data.find(account => 
        account.account_number === bankData.account_number && 
        account.bank_name === bankData.bank_name
      );
      
      if (existingAccount) {
        // Nếu tài khoản đã tồn tại, cập nhật thông tin thay vì thêm mới
        // Sử dụng ID của tài khoản đã tồn tại
        try {
          // Nếu yêu cầu đặt làm mặc định và chưa phải mặc định
          if (bankData.is_default && !existingAccount.is_default) {
            const updateResponse = await axios.put(
              `${API_URL}/users/bank-accounts/${existingAccount.id}`,
              {
                ...bankData,
                id: existingAccount.id,
                is_default: true
              },
              getHeaders()
            );
            
            return {
              success: true,
              message: 'Cập nhật tài khoản ngân hàng thành công',
              data: updateResponse.data.data || existingAccount
            };
          }
          
          // Nếu không yêu cầu thay đổi gì, trả về tài khoản hiện tại
          return {
            success: true,
            message: 'Tài khoản ngân hàng này đã tồn tại và đang được sử dụng',
            data: existingAccount
          };
        } catch (updateError) {
          console.error('Lỗi khi cập nhật tài khoản ngân hàng:', updateError);
          // Nếu API cập nhật gặp lỗi, vẫn trả về thành công với tài khoản hiện có
          return {
            success: true,
            message: 'Tài khoản ngân hàng này đã tồn tại và sẽ được sử dụng',
            data: existingAccount
          };
        }
      }
    }
    
    // Nếu không tìm thấy tài khoản tương tự, thực hiện thêm mới
    try {
      const response = await axios.post(
        `${API_URL}/users/bank-accounts`,
        bankData,
        getHeaders()
      );
      
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thêm tài khoản ngân hàng:', error);
      
      // Kiểm tra nếu lỗi báo tài khoản đã tồn tại (có thể do race condition)
      if (error.response && error.response.status === 400 && 
          error.response.data.message && 
          error.response.data.message.includes('đã tồn tại')) {
        
        // Thử lấy lại danh sách tài khoản để tìm tài khoản đã tồn tại
        try {
          const refreshedAccounts = await getLawyerBankAccounts();
          if (refreshedAccounts.success && refreshedAccounts.data) {
            const matchingAccount = refreshedAccounts.data.find(account => 
              account.account_number === bankData.account_number && 
              account.bank_name === bankData.bank_name
            );
            
            if (matchingAccount) {
              return {
                success: true,
                message: 'Tài khoản ngân hàng này đã tồn tại và sẽ được sử dụng',
                data: matchingAccount
              };
            }
          }
        } catch (retryError) {
          console.error('Lỗi khi kiểm tra lại tài khoản ngân hàng:', retryError);
        }
        
        // Nếu vẫn không tìm được, trả về thành công kèm dữ liệu người dùng đã gửi
        return {
          success: true,
          message: 'Tài khoản ngân hàng đã được xử lý',
          data: {
            ...bankData,
            id: Date.now(), // Tạo ID tạm thời
            is_default: bankData.is_default || false,
            created_at: new Date().toISOString()
          }
        };
      }
      
      // Lỗi khác
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể thêm tài khoản ngân hàng',
        data: null
      };
    }
  } catch (error) {
    console.error('Lỗi không xác định khi xử lý tài khoản ngân hàng:', error);
    
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      data: null
    };
  }
};

/**
 * Cập nhật trạng thái giao dịch
 * @param {number} transactionId - ID giao dịch
 * @param {string} status - Trạng thái mới
 * @param {Object} updateData - Dữ liệu cập nhật bổ sung
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const updateTransactionStatus = async (transactionId, status, updateData = {}) => {
  try {
    const response = await axios.patch(
      `${API_URL}/transactions/${transactionId}/status`,
      {
        status,
        ...updateData
      },
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể cập nhật trạng thái giao dịch'
      };
    }
    
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Kiểm tra xem ngân hàng có hỗ trợ tạo mã QR không
 * @param {string} bankName - Tên ngân hàng
 * @returns {boolean} - True nếu hỗ trợ, false nếu không
 */
export const supportsBankQR = (bankName) => {
  if (!bankName) return false;
  
  // Danh sách các ngân hàng được hỗ trợ tạo mã QR
  const supportedBanks = [
    'vietcombank', 'vietinbank', 'bidv', 'agribank', 'techcombank',
    'mbbank', 'vpbank', 'acb', 'sacombank', 'tpbank', 'hdbank',
    'ocb', 'vib', 'seabank'
  ];
  
  // Chuẩn hóa tên ngân hàng để so khớp
  const normalizedBankName = bankName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Xóa dấu
    .replace(/\s+/g, '')              // Xóa khoảng trắng
    .replace(/[^a-z0-9]/g, '');       // Chỉ giữ lại chữ cái và số
  
  // Kiểm tra xem tên ngân hàng có trong danh sách hỗ trợ không
  return supportedBanks.some(bank => normalizedBankName.includes(bank));
};

/**
 * Tạo chuỗi dữ liệu QR theo chuẩn VietQR cho các ngân hàng Việt Nam
 * @param {Object} bankData Thông tin tài khoản ngân hàng
 * @param {number} amount Số tiền thanh toán
 * @param {string} content Nội dung chuyển khoản
 * @returns {string} URL mã QR hoặc chuỗi dữ liệu cho mã QR
 */
export const generateBankQRData = (bankData, amount, content) => {
  if (!bankData || !bankData.bank_name || !bankData.account_number) {
    console.error('Không có thông tin tài khoản ngân hàng hợp lệ:', bankData);
    return '';
  }

  try {
    // Sử dụng sepay.vn API
    const accountNumber = bankData.account_number;
    const bankName = encodeURIComponent(bankData.bank_name);
    const cleanedAmount = amount ? Math.round(Number(amount)).toString() : '0';
    
    // Chuẩn hóa nội dung chuyển khoản (tối đa 25 ký tự, không dấu)
    const maxContentLength = 25;
    let cleanedContent = content || '';
    cleanedContent = cleanedContent
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Xóa dấu
      .replace(/[^a-zA-Z0-9\s]/g, '')   // Chỉ giữ lại chữ cái, số và khoảng trắng
      .substring(0, maxContentLength);   // Giới hạn độ dài
    
    // Mã hóa nội dung chuyển khoản
    const encodedContent = encodeURIComponent(cleanedContent);
    
    // Tạo URL cho mã QR từ sepay.vn
    const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankName}&amount=${cleanedAmount}&des=${encodedContent}`;
    
    console.log('Tạo mã QR cho tài khoản:', {
      bankName: bankData.bank_name,
      accountNumber: bankData.account_number,
      accountHolder: bankData.account_holder,
      amount: cleanedAmount,
      content: cleanedContent,
      qrUrl
    });
    
    return qrUrl;
  } catch (error) {
    console.error('Lỗi khi tạo URL mã QR:', error);
    return '';
  }
};

/**
 * Tạo chuỗi dữ liệu QR cho ví điện tử
 * @param {string} walletType Loại ví điện tử (momo, zalopay, e_wallet)
 * @param {number} amount Số tiền thanh toán
 * @param {string} content Nội dung thanh toán
 * @returns {string} Chuỗi dữ liệu cho mã QR
 */
export const generateWalletQRData = (walletType, amount, content) => {
  // Trong môi trường phát triển, chúng ta mô phỏng dữ liệu QR
  // Trong thực tế, cần tích hợp với API của các ví điện tử
  
  // Cấu trúc giả định: walletType|amount|content|timestamp
  const timestamp = new Date().getTime();
  
  return `${walletType}|${amount || 0}|${content || ''}|${timestamp}`;
};

/**
 * Lấy tất cả giao dịch (dành cho admin)
 * @param {Object} params - Tham số lọc và phân trang
 * @returns {Promise<Object>} Danh sách tất cả giao dịch
 */
export const getAllTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    // Xử lý ngày bắt đầu và kết thúc
    if (params.startDate) {
      // Nếu startDate chỉ là ngày (không có giờ), thêm thời gian bắt đầu của ngày
      const formattedStartDate = params.startDate.includes('T') 
        ? params.startDate 
        : `${params.startDate}T00:00:00.000Z`;
      queryParams.append('startDate', formattedStartDate);
    }
    
    if (params.endDate) {
      // Nếu endDate chỉ là ngày (không có giờ), thêm thời gian kết thúc của ngày
      const formattedEndDate = params.endDate.includes('T') 
        ? params.endDate 
        : `${params.endDate}T23:59:59.999Z`;
      queryParams.append('endDate', formattedEndDate);
    }
    
    // Kiểm tra token
    const token = getToken();
    if (!token) {
      console.error('Không tìm thấy token xác thực');
      return {
        success: false,
        message: 'Vui lòng đăng nhập lại để tiếp tục',
        data: [],
        total: 0
      };
    }
    
    const url = `${API_URL}/transactions/all?${queryParams.toString()}`;
    console.log('Gọi API:', url);
    
    const response = await axios.get(url, getHeaders());
    
    // Chuyển đổi dữ liệu từ định dạng API về định dạng frontend cần
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data || [],
      total: response.data.total || 0,
      count: response.data.count || 0
    };
  } catch (error) {
    console.error('Lỗi khi lấy tất cả giao dịch:', error);
    return {
      success: false,
      message: 'Không thể lấy danh sách giao dịch. Vui lòng thử lại sau.',
      data: [],
      total: 0
    };
  }
};

/**
 * Lấy danh sách phí pháp lý
 * @returns {Promise<Object>} Kết quả API chứa danh sách phí pháp lý
 */
export const getFeeReferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/transactions/fee-references`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phí pháp lý:', error);
    throw error;
  }
};

/**
 * Tạo mới phí pháp lý
 * @param {Object} feeData Thông tin phí pháp lý
 * @returns {Promise<Object>} Kết quả API chứa thông tin phí pháp lý đã tạo
 */
export const createFeeReference = async (feeData) => {
  try {
    const response = await axios.post(`${API_URL}/transactions/fee-references`, feeData, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo phí pháp lý mới:', error);
    throw error;
  }
};

/**
 * Cập nhật phí pháp lý
 * @param {number} id ID của phí pháp lý
 * @param {Object} feeData Thông tin phí pháp lý cần cập nhật
 * @returns {Promise<Object>} Kết quả API chứa thông tin phí pháp lý đã cập nhật
 */
export const updateFeeReference = async (id, feeData) => {
  try {
    const response = await axios.put(`${API_URL}/transactions/fee-references/${id}`, feeData, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật phí pháp lý:', error);
    throw error;
  }
};

/**
 * Xóa phí pháp lý
 * @param {number} id ID của phí pháp lý
 * @returns {Promise<Object>} Kết quả API
 */
export const deleteFeeReference = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/transactions/fee-references/${id}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa phí pháp lý:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin tài khoản ngân hàng
 * @param {number} accountId - ID tài khoản ngân hàng
 * @param {Object} bankData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const updateBankAccount = async (accountId, bankData) => {
  try {
    // Kiểm tra accountId hợp lệ
    if (!accountId) {
      return {
        success: false,
        message: 'ID tài khoản không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.put(
      `${API_URL}/users/bank-accounts/${accountId}`,
      bankData,
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật tài khoản ngân hàng:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể cập nhật tài khoản ngân hàng',
        data: null
      };
    }
    
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tài khoản ngân hàng',
      data: null
    };
  }
};

/**
 * Xóa tài khoản ngân hàng
 * @param {number} accountId - ID tài khoản ngân hàng
 * @returns {Promise<Object>} Kết quả xóa
 */
export const deleteBankAccount = async (accountId) => {
  try {
    // Kiểm tra accountId hợp lệ
    if (!accountId) {
      return {
        success: false,
        message: 'ID tài khoản không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.delete(
      `${API_URL}/users/bank-accounts/${accountId}`,
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa tài khoản ngân hàng:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Không thể xóa tài khoản ngân hàng',
        data: null
      };
    }
    
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi xóa tài khoản ngân hàng',
      data: null
    };
  }
};

export default {
  getLawyerTransactions,
  getLawyerFinancialStats,
  getTransactionById,
  confirmPaymentByLawyer,
  createTransaction,
  getPaymentMethods,
  getLawyerBankAccounts,
  addBankAccount,
  updateTransactionStatus,
  generateBankQRData,
  generateWalletQRData,
  getAllTransactions,
  getFeeReferences,
  createFeeReference,
  updateFeeReference,
  deleteFeeReference,
  supportsBankQR,
  updateBankAccount,
  deleteBankAccount
}; 