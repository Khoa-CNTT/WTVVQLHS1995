import axios from 'axios';

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
    // Xử lý lỗi xác thực (401 Unauthorized hoặc 403 Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!isTokenAlertDisplayed) {
        // Đánh dấu là đã hiển thị thông báo
        isTokenAlertDisplayed = true;
        
        // Hiển thị thông báo cho người dùng
        const messageText = error.response.status === 401 
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.';
        
        alert(messageText);
        
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
  if (!token) return;
  
  try {
    // Gọi API kiểm tra token
    await axiosInstance.get('/auth/verify-token');
  } catch (error) {
    // Nếu token không hợp lệ, sẽ tự động xử lý bởi interceptor ở trên
    console.log('Kiểm tra token thất bại:', error);
  }
};

export default axiosInstance;

