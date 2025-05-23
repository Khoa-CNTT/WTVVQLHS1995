import axios from 'axios';
import { sendOTPEmail } from './emailService';
import axiosInstance from '../config/axios';

const API_URL = 'http://localhost:8000/api/auth';

// Tạo instance axios với cấu hình mặc định
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cache OTP trong bộ nhớ (trong thực tế nên lưu vào localStorage)
const otpStorage = new Map();

// Cấu hình interceptor để thêm token vào header
authAxios.interceptors.request.use(
  (config) => {
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

// Tạo mã OTP và lưu
const generateAndStoreOTP = (userId, email, username) => {
  try {
    // Tạo OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Thời gian hết hạn OTP (15 phút)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Lưu OTP vào bộ nhớ (key = userId)
    otpStorage.set(userId.toString(), {
      otp,
      email,
      username,
      expiresAt,
      attempts: 0
    });
    
    return { otp, expiresAt };
  } catch (error) {
    throw new Error(`Lỗi tạo OTP: ${error.message}`);
  }
};

// Xác minh OTP
const verifyOTP = (userId, otp) => {
  try {
    const otpData = otpStorage.get(userId.toString());
    
    // Kiểm tra OTP có tồn tại không
    if (!otpData) {
      throw new Error('Mã OTP không tồn tại hoặc đã hết hạn');
    }
    
    // Kiểm tra OTP có hết hạn không
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(userId.toString());
      throw new Error('Mã OTP đã hết hạn');
    }
    
    // Kiểm tra OTP có đúng không
    if (otpData.otp !== otp) {
      // Tăng số lần thử
      otpData.attempts += 1;
      
      // Nếu thử sai quá 3 lần, xóa OTP
      if (otpData.attempts >= 3) {
        otpStorage.delete(userId.toString());
        throw new Error('Bạn đã nhập sai OTP quá nhiều lần');
      }
      
      throw new Error('Mã OTP không đúng');
    }
    
    // OTP đúng, xóa khỏi bộ nhớ
    otpStorage.delete(userId.toString());
    
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Đăng ký tài khoản mới
const register = async (userData) => {
  try {
    // 1. Gửi request tạo người dùng chưa xác minh
    const response = await authAxios.post('/register', userData);
    
    // Kiểm tra response có đúng định dạng không
    if (!response.data || !response.data.user) {
      console.error('Phản hồi từ server không đúng định dạng:', response);
      throw new Error('Phản hồi từ server không đúng định dạng');
    }
    
    const userId = response.data.user.id;
    
    // Kiểm tra userId có tồn tại không
    if (!userId) {
      console.error('Không tìm thấy userId trong phản hồi:', response.data);
      throw new Error('Không nhận được ID người dùng từ server');
    }
    
    // Lưu ý: Không cần tạo OTP mới, vì server đã tạo và gửi OTP
    
    return response.data;
  } catch (error) {
    console.error('Lỗi chi tiết khi đăng ký:', error);
    throw error.response?.data || { message: 'Lỗi đăng ký tài khoản: ' + (error.message || 'Không xác định') };
  }
};

// Xác minh tài khoản với OTP
const verifyAccount = async (userId, otp) => {
  try {
    // Không xác minh OTP ở phía client, mà gửi trực tiếp lên server để xác minh
    const response = await authAxios.post('/verify', { userId, otp });
    
    if (response.data && response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Mã OTP không hợp lệ');
    }
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { message: error.message || 'Lỗi xác minh tài khoản' };
  }
};

// Gửi lại mã OTP
const resendOTP = async (userId, email) => {
  try {
    // Gửi yêu cầu tạo OTP mới và gửi lại email
    const response = await authAxios.post('/resend-otp', { userId, email });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi gửi lại mã OTP' };
  }
};

// Đăng nhập
const login = async (usernameOrEmail, password) => {
  try {
    const response = await authAxios.post('/login', { 
      usernameOrEmail, 
      password 
    });
    
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Dispatch sự kiện đăng nhập thành công
      window.dispatchEvent(new Event('login'));
      window.dispatchEvent(new Event('loginStatusChanged'));
    } else {
      throw new Error('Không nhận được token xác thực từ server');
    }
    
    return response.data;
  } catch (error) {
    // Xử lý trường hợp tài khoản chưa xác minh
    if (error.response?.data?.message && 
        error.response.data.message.includes('chưa được xác minh')) {
      // Lấy ID người dùng từ chuỗi lỗi hoặc data trả về
      const userId = error.response.data.userId || null;
      const email = error.response.data.email || null;
      const username = error.response.data.username || null;
      
      // Tự động tạo và gửi OTP nếu có đủ thông tin
      if (userId && email && username) {
        try {
          // Tạo OTP mới
          const { otp } = generateAndStoreOTP(userId, email, username);
          
          // Gửi email chứa OTP
          await sendOTPEmail(email, username, otp);
          
        } catch (otpError) {
          console.error('Lỗi khi gửi OTP:', otpError);
        }
      }
      
      // Tạo lỗi với thông tin bổ sung để client xử lý
      const customError = {
        message: error.response.data.message,
        userId: userId,
        email: email,
        username: username,
        needVerification: true
      };
      
      throw customError;
    }
    
    // Xử lý trường hợp tài khoản bị khóa
    if (error.response?.data?.message && 
        (error.response.data.message.includes('đã bị khóa') || 
        error.response.data.message.includes('bị khóa'))) {
      throw {
        message: error.response.data.message,
        isLocked: true
      };
    }
    
    // Log lỗi để dễ dàng gỡ rối
    console.error('Lỗi đăng nhập:', error);
    
    // Trả về thông báo lỗi cụ thể
    if (error.message === 'Không nhận được token xác thực từ server') {
      throw { message: 'Lỗi xác thực từ server. Vui lòng thử lại sau.' };
    }
    
    // Kiểm tra lỗi secret key
    if (error.message && error.message.includes('secret')) {
      throw { message: 'Lỗi cấu hình xác thực. Vui lòng liên hệ quản trị viên.' };
    }
    
    throw error.response?.data || { message: 'Lỗi đăng nhập. Vui lòng thử lại sau.' };
  }
};

// Đăng xuất
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Dispatch sự kiện đăng xuất
  window.dispatchEvent(new Event('logout'));
  window.dispatchEvent(new Event('loginStatusChanged'));
};

// Lấy thông tin người dùng hiện tại
const getCurrentUser = () => {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    return null;
  }
};

// Kiểm tra người dùng đã đăng nhập chưa
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Kiểm tra xem token đã hết hạn chưa
    const currentUser = getCurrentUser();
    return !!currentUser;
  } catch (error) {
    console.error('Lỗi kiểm tra xác thực:', error);
    return false;
  }
};

// Kiểm tra email tồn tại
const checkEmailExists = async (email) => {
  try {
    // Sử dụng API thực tế
    const response = await authAxios.post('/forgot-password', { email });
    return {
      exists: true,
      userId: response.data.data.userId,
      email: response.data.data.email
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Email không tồn tại
      return { exists: false };
    }
    throw new Error(error.response?.data?.message || 'Lỗi kiểm tra email');
  }
};

// Gửi yêu cầu đặt lại mật khẩu
const requestPasswordReset = async (email) => {
  try {
    // Gửi yêu cầu đặt lại mật khẩu qua API
    const response = await authAxios.post('/forgot-password', { email });
    
    // Trích xuất thông tin từ response
    const { userId, email: userEmail, otp, fullName } = response.data.data;
    
    return { 
      status: 'success', 
      userId, 
      email: userEmail,
      otp: otp, // Thêm OTP vào response để frontend gửi email
      userName: fullName // Thêm tên người dùng nếu có
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lỗi gửi yêu cầu đặt lại mật khẩu');
  }
};

// Xác minh mã OTP đặt lại mật khẩu
const verifyResetToken = async (userId, otp) => {
  try {
    const response = await authAxios.post('/verify-reset-token', { userId, otp });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
  }
};

// Đặt lại mật khẩu
const resetPassword = async (userId, newPassword) => {
  try {
    // Sử dụng một giá trị mặc định cho currentPassword khi đặt lại mật khẩu
    // do quên mật khẩu không yêu cầu mật khẩu hiện tại, nhưng API vẫn cần tham số này
    const currentPassword = "reset_password_placeholder";
    
    const response = await authAxios.post('/change-password', { 
      userId, 
      currentPassword, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lỗi đặt lại mật khẩu');
  }
};

/**
 * Đổi mật khẩu của người dùng đã đăng nhập
 * @param {Object} passwordData Dữ liệu mật khẩu
 * @param {string} passwordData.currentPassword Mật khẩu hiện tại
 * @param {string} passwordData.newPassword Mật khẩu mới
 * @param {string} passwordData.confirmPassword Xác nhận mật khẩu mới
 * @returns {Promise} Promise chứa kết quả từ API
 */
export const changePassword = async (passwordData) => {
  const user = getCurrentUser();
  
  if (!user || !user.token) {
    throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
  }
  
  try {
    const response = await authAxios.post('/users/change-password', passwordData, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Kiểm tra token hết hạn
const checkTokenValidity = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Gọi API kiểm tra token
    const response = await axiosInstance.get('/auth/verify-token');
    return response.data.status === 'success';
  } catch (error) {
    console.error('Lỗi khi kiểm tra token:', error);
    return false;
  }
};

// Kiểm tra vai trò người dùng
const hasRole = (role) => {
  const user = getCurrentUser();
  
  if (!user || !user.role) return false;
  
  // Chuyển đổi cả hai thành chữ thường để so sánh
  const userRole = user.role.toLowerCase();
  const requiredRole = Array.isArray(role) 
    ? role.map(r => r.toLowerCase()) 
    : [role.toLowerCase()];
  
  return requiredRole.includes(userRole);
};

// Cập nhật thông tin người dùng trong localStorage mà không cần đăng nhập lại
const updateUserInLocalStorage = async () => {
  try {
    const token = localStorage.getItem('token');
    const currentUser = getCurrentUser();
    
    if (!token || !currentUser || !currentUser.id) {
      return false;
    }
    
    // Lấy thông tin người dùng mới từ API
    const response = await axios.get(`${API_URL}/auth/users/${currentUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.status === 'success') {
      const userData = response.data.data;
      
      // Tạo đối tượng user mới để lưu vào localStorage
      const updatedUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.full_name || userData.fullName,
        phone: userData.phone || '',
        role: userData.role || currentUser.role,
        avatarUrl: userData.avatar_url || userData.avatarUrl || currentUser.avatarUrl
      };
      
      // Lưu thông tin người dùng mới vào localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Lỗi cập nhật thông tin người dùng:', error);
    return false;
  }
};

// Lấy token
const getToken = () => {
  return localStorage.getItem('token');
};

const authService = {
  register,
  verifyAccount,
  resendOTP,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  checkEmailExists,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword,
  checkTokenValidity,
  hasRole,
  updateUserInLocalStorage,
  getToken
};

export default authService;

