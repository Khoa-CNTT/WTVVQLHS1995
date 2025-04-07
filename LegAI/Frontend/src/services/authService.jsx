import axios from 'axios';
import { sendOTPEmail } from './emailService';

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
    const userId = response.data.data.userId;
    
    // 2. Tạo OTP
    const { otp } = generateAndStoreOTP(userId, userData.email, userData.username);
    
    // 3. Gửi email chứa OTP bằng EmailJS
    await sendOTPEmail(userData.email, userData.username, otp);
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi đăng ký tài khoản' };
  }
};

// Xác minh tài khoản với OTP
const verifyAccount = async (userId, otp) => {
  try {
    // 1. Xác minh OTP ở phía client
    const verified = verifyOTP(userId, otp);
    
    if (verified) {
      // 2. Gửi request cập nhật trạng thái xác minh
      const response = await authAxios.post('/verify', { userId, otp });
      return response.data;
    }
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Lỗi xác minh tài khoản' };
  }
};

// Gửi lại mã OTP
const resendOTP = async (userId, email) => {
  try {
    // 1. Lấy thông tin người dùng
    const userResponse = await authAxios.get(`/users/${userId}`);
    const username = userResponse.data.data.username;
    
    // 2. Tạo OTP mới
    const { otp } = generateAndStoreOTP(userId, email, username);
    
    // 3. Gửi email chứa OTP bằng EmailJS
    await sendOTPEmail(email, username, otp);
    
    return { status: 'success', message: 'Đã gửi lại mã OTP, vui lòng kiểm tra email' };
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi gửi lại mã OTP' };
  }
};

// Đăng nhập
const login = async (username, password) => {
  try {
    const response = await authAxios.post('/login', { username, password });
    
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi đăng nhập' };
  }
};

// Đăng xuất
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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
  return !!localStorage.getItem('token');
};

const authService = {
  register,
  verifyAccount,
  resendOTP,
  login,
  logout,
  getCurrentUser,
  isAuthenticated
};

export default authService;
