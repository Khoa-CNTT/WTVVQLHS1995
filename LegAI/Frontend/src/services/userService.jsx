import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8000/api';

// Tạo instance axios với cấu hình mặc định
const userAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cấu hình interceptor để thêm token vào header
userAxios.interceptors.request.use(
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

// Lấy thông tin người dùng theo ID
const getUserProfile = async (userId) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi lấy thông tin người dùng' };
  }
};

// Cập nhật thông tin hồ sơ người dùng
const updateUserProfile = async (userId, userData) => {
  try {
    // Lấy thông tin người dùng hiện tại từ localStorage để bảo toàn vai trò
    const currentUser = authService.getCurrentUser();
    
    // Chuẩn bị dữ liệu để cập nhật
    const updateData = {
      ...userData,
      role: currentUser?.role || 'user' // Giữ nguyên vai trò hiện tại
    };
    
    const response = await userAxios.put(`/auth/users/${userId}`, updateData);
    
    if (response.data.status === 'success') {
      // Cập nhật localStorage
      if (currentUser) {
        // Cập nhật dữ liệu mới nhưng giữ nguyên vai trò
        const updatedUserData = response.data.data;
        
        // Đảm bảo vai trò được giữ nguyên
        if (!updatedUserData.role) {
          updatedUserData.role = currentUser.role;
        }
        
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...updatedUserData,
          role: currentUser.role // Đảm bảo vai trò không bị ghi đè
        }));
      }
      
      return response.data.data;
    } else {
      throw new Error('Cập nhật thông tin người dùng thất bại');
    }
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error);
    throw error;
  }
};

// Thay đổi mật khẩu
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await userAxios.post(`/auth/change-password`, {
      userId,
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi thay đổi mật khẩu' };
  }
};

// Tải lên ảnh đại diện
const uploadAvatar = async (userId, formData) => {
  try {
    // Thay đổi content-type để phù hợp với tải lên file
    const response = await userAxios.post(`/auth/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi tải lên ảnh đại diện' };
  }
};

// Lấy thông tin chi tiết luật sư
const getLawyerDetails = async (userId) => {
  try {
    // Kiểm tra vai trò người dùng trước khi gọi API
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Nếu không phải luật sư, trả về dữ liệu rỗng mà không cần gọi API
    // Sử dụng toLowerCase() để đảm bảo không phân biệt chữ hoa/thường
    if (!currentUser || currentUser.role?.toLowerCase() !== 'lawyer') {
      return {
        certification: '',
        experienceYears: 0,
        specialization: '',
        rating: 0.0
      };
    }
    
    // Chỉ gọi API khi người dùng có vai trò là luật sư
    const response = await userAxios.get(`/lawyers/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi lấy thông tin luật sư:', error);
    
    // Trường hợp endpoint không tồn tại hoặc lỗi khác
    if (error.response && error.response.status === 404) {
      console.log('API cho thông tin luật sư chưa được triển khai, trả về dữ liệu mẫu');
    }
    
    // Trả về dữ liệu trống nếu không phải là luật sư hoặc có lỗi
    return {
      certification: '',
      experienceYears: 0,
      specialization: '',
      rating: 0.0
    };
  }
};

// Lấy thống kê hoạt động của người dùng
const getUserStats = async (userId) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi lấy thống kê người dùng:', error);
    // Trả về dữ liệu trống nếu có lỗi
    return {
      documents: 0,
      cases: 0,
      appointments: 0,
      consultations: 0
    };
  }
};

// Lấy danh sách tài liệu của người dùng
const getUserDocuments = async (userId, page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}/documents?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi lấy danh sách tài liệu' };
  }
};

// Lấy danh sách vụ án của người dùng
const getUserCases = async (userId, page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}/cases?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi lấy danh sách vụ án' };
  }
};

// Lấy danh sách cuộc hẹn của người dùng
const getUserAppointments = async (userId, page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}/appointments?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi lấy danh sách cuộc hẹn' };
  }
};

// Lấy lịch sử tư vấn AI của người dùng
const getUserConsultations = async (userId, page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/auth/users/${userId}/consultations?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi lấy lịch sử tư vấn' };
  }
};

const userService = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadAvatar,
  getLawyerDetails,
  getUserStats,
  getUserDocuments,
  getUserCases,
  getUserAppointments,
  getUserConsultations
};

export default userService;
