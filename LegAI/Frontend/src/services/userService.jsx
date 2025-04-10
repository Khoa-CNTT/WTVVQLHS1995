import axios from 'axios';

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
    const response = await userAxios.put(`/auth/users/${userId}`, userData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi cập nhật thông tin người dùng' };
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
    const response = await userAxios.get(`/lawyers/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Lỗi lấy thông tin luật sư:', error);
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
