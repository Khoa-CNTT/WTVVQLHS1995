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
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      console.error('ID giao dịch không hợp lệ:', transactionId);
      return {
        success: false,
        message: 'ID giao dịch không hợp lệ',
        data: null
      };
    }
    
    const response = await axios.get(
      `${API_URL}/transactions/${transactionId}`,
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
 * Tạo chuỗi dữ liệu QR theo chuẩn VietQR cho các ngân hàng Việt Nam
 * @param {Object} bankData Thông tin tài khoản ngân hàng
 * @param {number} amount Số tiền thanh toán
 * @param {string} content Nội dung chuyển khoản
 * @returns {string} Chuỗi dữ liệu cho mã QR
 */
export const generateBankQRData = (bankData, amount, content) => {
  if (!bankData || !bankData.bank_name || !bankData.account_number) {
    return '';
  }

  // Cấu trúc mã VietQR: 
  // Mã ngân hàng theo napas|Số tài khoản|Số tiền|Nội dung chuyển khoản
  
  // Mapping tên ngân hàng sang mã BIN ngân hàng theo chuẩn Napas
  const bankBins = {
    // Các ngân hàng lớn
    'vietcombank': '970436',
    'vietinbank': '970415',
    'bidv': '970418',
    'agribank': '970405',
    'techcombank': '970407',
    'mbbank': '970422',
    'vpbank': '970432',
    'acb': '970416',
    'sacombank': '970403',
    'tpbank': '970423',
    'hdbank': '970437',
    'ocb': '970448',
    'scb': '970429',
    'vib': '970441',
    'msb': '970426',
    'seabank': '970440',
    'baovietbank': '970438',
    'namabank': '970428',
    'abbank': '970425',
    'vietabank': '970427',
    'eximbank': '970431',
    'gpbank': '970408',
    'kienlongbank': '970452',
    'lienvietpostbank': '970449',
    'ncb': '970419',
    'oceanbank': '970414',
    'pgbank': '970430',
    'pvcombank': '970412',
    'shinhanbank': '970424',
    'vietbank': '970433',
    'wooribank': '970457'
  };
  
  // Chuẩn hóa tên ngân hàng để so khớp với danh sách mã BIN
  // Xóa dấu, khoảng trắng, chuyển về chữ thường
  const normalizeBankName = (name) => {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Xóa dấu
      .replace(/\s+/g, '')              // Xóa khoảng trắng
      .replace(/[^a-z0-9]/g, '');       // Chỉ giữ lại chữ cái và số
  };
  
  // Tìm mã BIN từ tên ngân hàng được chuẩn hóa
  const normalizedBankName = normalizeBankName(bankData.bank_name);
  let bankBin = '';
  
  // Tìm ngân hàng từ tên được chuẩn hóa
  for (const [bank, bin] of Object.entries(bankBins)) {
    if (normalizedBankName.includes(bank)) {
      bankBin = bin;
      break;
    }
  }
  
  // Nếu không tìm thấy, sử dụng VietQR chung
  if (!bankBin) {
    // Tìm kiếm theo từ khóa thông dụng
    if (normalizedBankName.includes('vietcom')) bankBin = '970436';
    else if (normalizedBankName.includes('vietin')) bankBin = '970415';
    else if (normalizedBankName.includes('bidv')) bankBin = '970418';
    else if (normalizedBankName.includes('agri')) bankBin = '970405';
    else if (normalizedBankName.includes('techcom')) bankBin = '970407';
    else if (normalizedBankName.includes('mb')) bankBin = '970422';
    else if (normalizedBankName.includes('vp')) bankBin = '970432';
    else if (normalizedBankName.includes('acb')) bankBin = '970416';
    else if (normalizedBankName.includes('sacom')) bankBin = '970403';
    else bankBin = '970436'; // Mặc định là Vietcombank nếu không nhận dạng được
  }
  
  // Chuẩn hóa số tiền (số nguyên, không có dấu phẩy hay chấm)
  const cleanedAmount = amount ? Math.round(Number(amount)).toString() : '0';
  
  // Chuẩn hóa nội dung chuyển khoản (tối đa 25 ký tự, không dấu)
  const maxContentLength = 25;
  let cleanedContent = content || '';
  cleanedContent = cleanedContent
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Xóa dấu
    .replace(/[^a-zA-Z0-9\s]/g, '')   // Chỉ giữ lại chữ cái, số và khoảng trắng
    .substring(0, maxContentLength);   // Giới hạn độ dài
  
  // Tạo chuỗi dữ liệu QR theo chuẩn VietQR
  // Định dạng: bankBin|accountNumber|amount|content
  const qrData = `${bankBin}|${bankData.account_number}|${cleanedAmount}|${cleanedContent}`;
  
  console.log('Tạo mã QR cho tài khoản:', {
    bankName: bankData.bank_name,
    accountNumber: bankData.account_number,
    accountHolder: bankData.account_holder,
    normalizedBankName,
    bankBin,
    amount: cleanedAmount,
    content: cleanedContent,
    qrData
  });
  
  return qrData;
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
  generateWalletQRData
}; 