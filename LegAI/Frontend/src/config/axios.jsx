import axios from 'axios';
import { toast } from 'react-toastify';

const baseURL = 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Biến để theo dõi xem có thông báo lỗi token nào đang hiển thị không
let isTokenAlertDisplayed = false;

// Thêm interceptor cho request
axiosInstance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('Gửi yêu cầu không có token');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log chi tiết về lỗi
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    
    // Xử lý lỗi xác thực (401 Unauthorized hoặc 403 Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Trường hợp đặc biệt: Nếu đây là API tính phí hoặc API liên quan đến case detail, 
      // không chuyển trang login mà trả về lỗi để component tự xử lý
      if (error.config && (
          error.config.url.includes('calculate-fee') || 
          error.config.url.includes('legal-cases')
      )) {
        console.log('API đặc biệt, không chuyển trang login:', error.config.url);
        return Promise.reject(error);
      }
      
      if (!isTokenAlertDisplayed) {
        // Đánh dấu là đã hiển thị thông báo
        isTokenAlertDisplayed = true;
        
        // Hiển thị thông báo cho người dùng
        const messageText = error.response.status === 401 
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.';
        
        toast.error(messageText);
        
        // Xóa thông tin đăng nhập và chuyển đến trang login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/login';
        
        // Reset trạng thái hiển thị thông báo sau một khoảng thời gian
        setTimeout(() => {
          isTokenAlertDisplayed = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

// Hàm kiểm tra token hết hạn khi ứng dụng khởi động
export const checkTokenExpiration = async () => {
  const token = localStorage.getItem('token');
  
  // Nếu không có token, không cần kiểm tra
  if (!token) {
    console.log('Không có token để kiểm tra');
    return;
  }
  
  try {
    // Gọi API kiểm tra token
    const response = await axiosInstance.get('/auth/verify-token');
  } catch (error) {
    console.error('Kiểm tra token thất bại:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Không nhận được phản hồi từ server');
    } else {
      console.error('Lỗi:', error.message);
    }
    
    // Nếu token không hợp lệ và chưa có thông báo, hiển thị thông báo
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !isTokenAlertDisplayed) {
      isTokenAlertDisplayed = true;
      
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      
      // Xóa thông tin đăng nhập
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Chuyển hướng về trang đăng nhập sau 1 giây
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      // Reset trạng thái hiển thị thông báo
      setTimeout(() => {
        isTokenAlertDisplayed = false;
      }, 3000);
    }
  }
};

export default axiosInstance;

