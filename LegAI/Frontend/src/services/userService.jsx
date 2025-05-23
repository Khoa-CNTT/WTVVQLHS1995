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
    // Kiểm tra tham số userId
    if (!userId) {
      throw new Error('Thiếu ID người dùng');
    }

    // Lấy thông tin người dùng hiện tại từ localStorage để bảo toàn vai trò
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Không thể lấy thông tin người dùng hiện tại');
    }
    
    // Trước khi gửi, kiểm tra xem có trường fullName được yêu cầu từ API không
    // Nếu không có trong dữ liệu cập nhật, sử dụng giá trị hiện tại
    const updateData = {
      ...userData
    };
    
    // Kiểm tra nếu không có fullName trong dữ liệu cập nhật, sử dụng giá trị hiện tại
    if (!updateData.fullName && !updateData.full_name) {
      updateData.fullName = currentUser.fullName || currentUser.full_name || '';
    }
    
    // Giữ nguyên vai trò hiện tại
    updateData.role = currentUser.role || 'user';
    
    // Chuyển đổi trường hợp user_id là đối tượng thành chuỗi 
    const userIdValue = typeof userId === 'object' ? userId.id : userId;
    
    console.log('Dữ liệu cập nhật gửi đến API:', updateData);
    
    const response = await userAxios.put(`/auth/users/${userIdValue}`, updateData);
    
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
      
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Cập nhật thông tin người dùng thất bại'
      };
    }
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Lỗi cập nhật thông tin người dùng'
    };
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
const uploadAvatar = async (userId, formData, config = {}) => {
  try {
    // Sửa đường dẫn API để trỏ đến endpoint đúng
    const response = await userAxios.post(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config
    });
    
    
    // Làm mới thông tin người dùng sau khi tải lên avatar thành công
    if (response.data && response.data.status === 'success') {
      await refreshUserData();
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi chi tiết khi tải lên avatar:', error);
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
    const response = await userAxios.get(`/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Lỗi lấy thống kê người dùng:', error);
    // Trả về dữ liệu trống nếu có lỗi
    return {
      status: 'error',
      data: {
        documents: 0,
        cases: 0,
        appointments: 0,
        contracts: 0
      }
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
    
    // Kiểm tra và chuẩn hóa dữ liệu trả về
    const appointments = response.data && response.data.data 
      ? Array.isArray(response.data.data) 
        ? response.data.data 
        : []
      : [];
    
    // Thêm thông tin luật sư đầy đủ cho mỗi lịch hẹn
    const enhancedAppointments = appointments.map(app => ({
      ...app,
      lawyer_name: app.lawyer_name || (app.lawyer ? app.lawyer.full_name : 'Luật sư'),
      lawyer_avatar: app.avatar_url || (app.lawyer ? app.lawyer.avatar_url : null),
      specialization: app.specialization || (app.lawyer ? app.lawyer.specialization : 'Luật sư đa lĩnh vực')
    }));
    
    return {
      success: true,
      data: enhancedAppointments,
      totalCount: response.data.count || enhancedAppointments.length
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cuộc hẹn:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Lỗi lấy danh sách cuộc hẹn'
    };
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

// Thêm hàm mới để làm mới thông tin user
const refreshUserData = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser || !currentUser.id) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }
    
    const response = await userAxios.get(`/auth/users/${currentUser.id}`);
    
    if (response.data && response.data.status === 'success') {
      const userData = response.data.data;
      
      // Cập nhật thông tin người dùng trong localStorage
      const updatedUser = {
        ...currentUser,
        fullName: userData.full_name || currentUser.fullName,
        email: userData.email || currentUser.email,
        phone: userData.phone || currentUser.phone,
        role: userData.role || currentUser.role,
        avatarUrl: userData.avatar_url || currentUser.avatarUrl
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    return currentUser;
  } catch (error) {
    console.error('Lỗi khi làm mới thông tin người dùng:', error);
    throw error;
  }
};

// Cập nhật hàm getAllLawyers để thêm đầy đủ tham số
const getAllLawyers = async (page = 1, limit = 10, searchTerm = '', specialization = '') => {
  try {
    // Xây dựng query parameters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    if (specialization) {
      params.append('specialization', specialization);
    }
    
    // Thêm tham số để chỉ định tìm kiếm không phân biệt chữ hoa/thường cho role
    params.append('case_insensitive', 'true');
    const response = await userAxios.get(`/auth/lawyers?${params.toString()}`);
    // Xử lý kết quả để đảm bảo đúng role lawyer không phân biệt hoa thường
    if (response.data && response.data.data && response.data.data.lawyers) {
      // Lọc luật sư theo role và chuẩn hóa dữ liệu
      response.data.data.lawyers = response.data.data.lawyers
        .filter(user => user.role && user.role.toLowerCase() === 'lawyer')
        .map(lawyer => ({
          ...lawyer,
          // Đảm bảo rating luôn là số
          rating: parseFloat(lawyer.rating || 0),
          // Đảm bảo specialization luôn là mảng
          specialization: Array.isArray(lawyer.specialization) 
            ? lawyer.specialization 
            : lawyer.specialization ? lawyer.specialization.split(',') : [],
          // Đảm bảo experienceYears luôn là số
          experienceYears: parseInt(lawyer.experienceYears || 0)
        }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi lấy danh sách luật sư:', error);
    // Trả về đối tượng với cấu trúc tương tự response thành công
    return {
      success: false,
      message: 'Không thể tải danh sách luật sư: ' + (error.message || 'Lỗi không xác định'),
      data: {
        lawyers: [],
        totalLawyers: 0,
        totalPages: 0,
        currentPage: page
      }
    };
  }
};

// Cập nhật hàm getLawyerById
const getLawyerById = async (lawyerId) => {
  try {
    const response = await userAxios.get(`/auth/lawyers/${lawyerId}`);
    
    // Kiểm tra vai trò để đảm bảo là luật sư không phân biệt chữ hoa/thường
    const lawyerData = response.data.data;
    if (lawyerData && lawyerData.role && lawyerData.role.toLowerCase() !== 'lawyer') {
      console.warn('Đối tượng được truy vấn không phải là luật sư');
    }
    return response.data.data;
  } catch (error) {
    console.error('Lỗi lấy thông tin luật sư:', error);
    throw error;
  }
};

// Lấy URL đầy đủ cho avatar
const getFullAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '/default-avatar.png';
  
  // Nếu đã là URL đầy đủ, trả về nguyên bản
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Xử lý đường dẫn có /uploads/
  if (avatarPath.includes('/uploads/')) {
    // Đảm bảo không đúp /uploads/
    const cleanPath = avatarPath.replace('/uploads/', '');
    return `${API_URL.replace('/api', '')}/uploads/${cleanPath}`;
  }
  
  // Nếu là đường dẫn tương đối, thêm tiền tố API_URL
  if (avatarPath.startsWith('/')) {
    return `${API_URL.replace('/api', '')}${avatarPath}`;
  }
  
  // Trường hợp còn lại: chỉ có tên file
  return `${API_URL.replace('/api', '')}/uploads/${avatarPath}`;
};

// Tìm người dùng theo email
const findUserByEmail = async (email) => {
  try {
    // Gọi API để tìm người dùng theo email
    const response = await userAxios.get(`/auth/users`);
    
    // Kiểm tra cấu trúc dữ liệu trả về và xử lý tất cả trường hợp có thể
    if (response.data) {
      let users = [];
      
      // Trường hợp 1: Cấu trúc { data: [...users] }
      if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      } 
      // Trường hợp 2: Cấu trúc { status: 'success', data: { users: [...] } }
      else if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.users)) {
        users = response.data.data.users;
      }
      // Trường hợp 3: Cấu trúc { status: 'success', data: { data: [...] } }
      else if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.data)) {
        users = response.data.data.data;
      }
      // Trường hợp 4: Dữ liệu trả về trực tiếp là mảng
      else if (Array.isArray(response.data)) {
        users = response.data;
      }
      
      if (users.length > 0) {
        // Tìm người dùng có email khớp (không phân biệt hoa thường)
        const foundUser = users.find(user => 
          user.email && user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (foundUser) {
          return {
            success: true,
            data: foundUser
          };
        }
      }
      
      // Không tìm thấy người dùng
      return {
        success: false,
        message: 'Không tìm thấy người dùng với email này',
        data: null
      };
    } else {
      console.warn('Không nhận được dữ liệu từ API');
      return {
        success: false,
        message: 'Không thể lấy dữ liệu người dùng từ máy chủ',
        data: null
      };
    }
  } catch (error) {
    console.error('Lỗi khi tìm người dùng theo email:', error);
    if (error.response) {
      console.error('Mã lỗi:', error.response.status);
      console.error('Nội dung lỗi:', error.response.data);
    }
    
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm người dùng',
      data: null
    };
  }
};

// Lấy danh sách người dùng
const getUsers = async (params = {}) => {
  try {
    // Tạo query string từ params
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await userAxios.get(`/auth/users${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    throw error;
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
  getUserConsultations,
  getAllLawyers,
  getLawyerById,
  refreshUserData,
  getFullAvatarUrl,
  findUserByEmail,
  getUsers
};

export default userService;
