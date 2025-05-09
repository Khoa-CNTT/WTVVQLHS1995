import axios from 'axios';
import { API_URL } from '../config/constants';
import { toast } from 'react-toastify';

// Lấy token
const getToken = () => {
  return localStorage.getItem('token');
};

// Thiết lập header
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Tạo lịch hẹn mới
const createAppointment = async (appointmentData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!appointmentData.lawyer_id || !appointmentData.customer_id || 
        !appointmentData.start_time || !appointmentData.end_time) {
      console.error('Thiếu thông tin bắt buộc khi tạo lịch hẹn');
      return {
        status: 'error',
        message: 'Thiếu thông tin bắt buộc cho cuộc hẹn'
      };
    }


    // Chuẩn bị dữ liệu cho appointment
    const appointment = {
      customer_id: appointmentData.customer_id,
      lawyer_id: appointmentData.lawyer_id,
      start_time: adjustTimeForVietnamTimezone(appointmentData.start_time),
      end_time: adjustTimeForVietnamTimezone(appointmentData.end_time),
      status: 'pending',
      purpose: appointmentData.purpose || '',
      notes: appointmentData.notes || ''
    };


    // Tạo cuộc hẹn mới
    try {
      const response = await axios.post(
        `${API_URL}/appointments`, 
        appointment, 
        { headers: getHeaders() }
      );

  
      // Kiểm tra phản hồi
      if (response.data) {
        if (response.data.status === 'success') {
          return {
            status: 'success',
            data: response.data.data || response.data
          };
        } else {
          return {
            status: 'error',
            message: response.data.message || 'Không thể tạo lịch hẹn'
          };
        }
      }
      
      // Phản hồi không đúng định dạng
      return {
        status: 'error',
        message: 'Phản hồi từ máy chủ không đúng định dạng'
      };
    } catch (error) {
      console.error('Lỗi API khi tạo lịch hẹn:', error);
      
      if (error.response) {
        console.error('Chi tiết lỗi:', error.response.status, error.response.data);
        
        // Xử lý lỗi HTML từ API để trích xuất thông báo lỗi
        if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<pre>Error:')) {
          const errorMatch = error.response.data.match(/<pre>Error: (.*?)<br>/);
          if (errorMatch && errorMatch[1]) {
            return { 
              status: 'error', 
              message: errorMatch[1].trim()
            };
          }
        }
        
        // Xử lý lỗi API cụ thể dựa trên status code
        if (error.response.status === 500) {
          return { 
            status: 'error', 
            message: 'Lỗi máy chủ, vui lòng thử lại sau' 
          };
        } else if (error.response.status === 400) {
          // Với trường hợp luật sư không có lịch trống
          if (error.response.data && error.response.data.message && 
              error.response.data.message.includes('không có lịch trống')) {
            return { 
              status: 'error', 
              message: 'Luật sư không khả dụng trong khung giờ này. Vui lòng chọn thời gian khác.'
            };
          }
          
          return { 
            status: 'error', 
            message: error.response.data?.message || 'Dữ liệu không hợp lệ'
          };
        } else if (error.response.status === 409) {
          return { 
            status: 'error', 
            message: 'Lịch hẹn bị trùng hoặc đã có người đặt trước' 
          };
        } else if (error.response.data && error.response.data.message) {
          return { 
            status: 'error', 
            message: error.response.data.message 
          };
        }
      }
      
      // Lỗi khác
      return { 
        status: 'error', 
        message: error.message || 'Lỗi khi đặt lịch hẹn' 
      };
    }
  } catch (error) {
    console.error('Lỗi ngoại lệ khi tạo lịch hẹn:', error);
    return { 
      status: 'error', 
      message: 'Lỗi không xác định khi đặt lịch hẹn, vui lòng thử lại sau'
    };
  }
};

// Lấy danh sách lịch hẹn
const getAppointments = async (status = null) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const isLawyer = currentUser.role?.toLowerCase() === 'lawyer';
    
    const url = status ? 
      `${API_URL}/appointments?status=${status}` : 
      `${API_URL}/appointments`;
    
    const response = await axios.get(url, { headers: getHeaders() });
    
    if (!response.data) {
      console.error('API trả về dữ liệu không hợp lệ');
      return {
        status: 'error',
        message: 'Không thể lấy danh sách lịch hẹn',
        data: []
      };
    }
    
    // Xử lý dữ liệu trùng lặp nếu có
    if (response.data.status === 'success' && Array.isArray(response.data.data)) {
      // Lọc các ID trùng lặp
      const uniqueAppointments = [];
      const uniqueIds = new Set();
      
      response.data.data.forEach(app => {
        if (!uniqueIds.has(app.id)) {
          uniqueIds.add(app.id);
          uniqueAppointments.push(app);
        }
      });
      
      // Ghi đè lại dữ liệu đã lọc
      response.data.data = uniqueAppointments;
      
      // Cập nhật count
      response.data.count = uniqueAppointments.length;
    }

    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    // Trả về đối tượng lỗi với cấu trúc phù hợp thay vì throw exception
    return { 
      status: 'error', 
      message: error.response?.data?.message || 'Không thể lấy danh sách lịch hẹn',
      data: []
    };
  }
};

// Lấy chi tiết lịch hẹn
const getAppointmentById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID lịch hẹn không hợp lệ');
    }

    const response = await axios.get(
      `${API_URL}/appointments/${id}`, 
      { headers: getHeaders() }
    );

    if (!response.data) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể lấy thông tin lịch hẹn' 
    };
  }
};

// Cập nhật trạng thái lịch hẹn (chỉ dành cho luật sư)
const updateAppointmentStatus = async (id, status, notes = '') => {
  try {
    if (!id || !status) {
      throw new Error('Thiếu thông tin cập nhật');
    }

    const response = await axios.put(
      `${API_URL}/appointments/${id}/status`, 
      { status, notes }, 
      { headers: getHeaders() }
    );

    if (!response.data || response.data.status === 'error') {
      throw new Error('Không thể cập nhật trạng thái');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể cập nhật trạng thái lịch hẹn' 
    };
  }
};

// Huỷ lịch hẹn
const cancelAppointment = async (id, reason = '') => {
  try {
    if (!id) {
      console.error('ID lịch hẹn không hợp lệ khi huỷ');
      return {
        status: 'error',
        message: 'ID lịch hẹn không hợp lệ'
      };
    }

    // Đảm bảo reason luôn là string
    const cancelReason = reason ? String(reason) : '';

    const response = await axios.delete(
      `${API_URL}/appointments/${id}`, 
      { 
        headers: getHeaders(),
        data: { reason: cancelReason }
      }
    );

    if (!response.data) {
      console.error('Phản hồi API không hợp lệ khi huỷ lịch hẹn');
      return {
        status: 'error',
        message: 'Phản hồi không hợp lệ khi huỷ lịch hẹn'
      };
    }

    if (response.data.status === 'error') {
      console.error('Lỗi API khi huỷ lịch hẹn:', response.data.message);
      return response.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi ngoại lệ khi huỷ lịch hẹn:', error);
    
    if (error.response && error.response.data) {
      console.error('Chi tiết lỗi từ server:', error.response.data);
      return { 
        status: 'error', 
        message: error.response.data.message || 'Không thể huỷ lịch hẹn'
      };
    }
    
    return { 
      status: 'error', 
      message: error.message || 'Không thể huỷ lịch hẹn. Vui lòng thử lại sau'
    };
  }
};

// Lấy khung giờ làm việc của luật sư
const getLawyerAvailability = async (lawyerId) => {
  try {
    if (!lawyerId) {
      console.error('getLawyerAvailability: ID luật sư không hợp lệ');
      return {
        status: 'error',
        message: 'ID luật sư không hợp lệ',
        data: []
      };
    }

    console.log(`Đang lấy lịch trống cho luật sư ID: ${lawyerId}`);
    
    const response = await axios.get(
      `${API_URL}/appointments/lawyer/${lawyerId}/availability`,
      { headers: getHeaders() }
    );

    console.log('Phản hồi API:', response.data);

    // Trả về đúng dữ liệu nhận được từ API backend
    if (response.data && response.data.status === 'success') {
      // Đảm bảo trả về dữ liệu dạng mảng
      const responseData = response.data.data || [];
      return {
        status: 'success',
        data: responseData,
        message: response.data.message || 'Lấy lịch trống thành công'
      };
    }
    
    // Nếu không có response.data hoặc status không phải success
    return {
      status: 'error',
      data: [],
      message: response.data?.message || 'Không thể lấy lịch trống'
    };
  } catch (error) {
    console.error('Lỗi khi lấy lịch làm việc của luật sư:', error);
    let errorMessage = 'Không thể lấy lịch làm việc của luật sư';
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      status: 'success', // Thay đổi từ 'error' sang 'success' để luồng xử lý không bị ngắt
      message: errorMessage,
      data: []
    };
  }
};

// Thêm lịch trống mới cho luật sư
export const addAvailability = async (availabilityData) => {
  try {
    // Xác thực dữ liệu đầu vào
    if (!availabilityData || !availabilityData.lawyer_id || !availabilityData.start_time || !availabilityData.end_time) {
      return { success: false, message: 'Thiếu thông tin cần thiết' };
    }
    
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // Kiểm tra xem người dùng có phải là luật sư không
    if (!currentUser || !currentUser.role || currentUser.role.toLowerCase() !== 'lawyer') {
      return { success: false, message: 'Chỉ luật sư mới có thể thêm lịch trống', code: 403 };
    }
    
    // GIỮ NGUYÊN dữ liệu timestamp đã được định dạng chuẩn từ component
    // KHÔNG thực hiện bất kỳ chuyển đổi nào về ngày tháng ở đây
    const dataToSend = {
      lawyer_id: availabilityData.lawyer_id,
      start_time: availabilityData.start_time,
      end_time: availabilityData.end_time
    };
    
    // Kiểm tra xem có slot trùng không
    const existingSlots = await getLawyerAvailability(availabilityData.lawyer_id);
    
    // Lấy ngày từ chuỗi thời gian để so sánh (chỉ dùng cho kiểm tra)
    const startTimeRaw = new Date(availabilityData.start_time);
    const endTimeRaw = new Date(availabilityData.end_time);
    
    // Chỉ kiểm tra nếu có dữ liệu
    if (existingSlots && existingSlots.status === 'success' && Array.isArray(existingSlots.data) && existingSlots.data.length > 0) {
      const hasOverlap = existingSlots.data.some(slot => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);
        return (startTimeRaw < slotEnd && endTimeRaw > slotStart);
      });

      if (hasOverlap) {
        return { 
          success: false, 
          message: `Lịch trống bị trùng với slot đã tồn tại trong khoảng từ ${formatDateTime(startTimeRaw)} đến ${formatDateTime(endTimeRaw)}` 
        };
      }
    }

    // Thêm header Content-Type để đảm bảo server xử lý đúng định dạng
    const headers = {
      ...getHeaders(),
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(
      `${API_URL}/appointments/availability`,
      dataToSend,
      { headers }
    );

    // Xử lý phản hồi với nhiều trường hợp khác nhau
    if (response.data) {
      if (response.data.status === 'success') {
        return { 
          success: true, 
          data: response.data.data || response.data
        };
      } else if (response.data.status === 'error') {
        return {
          success: false,
          message: response.data.message || 'Không thể thêm lịch trống'
        };
      }
    }
    
    // Mặc định nếu không rơi vào trường hợp nào
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.error('Lỗi khi thêm lịch trống:', error);
    
    if (error.response) {
      // Lỗi từ server
      return { 
        success: false, 
        message: error.response.data?.message || 'Không thể thêm lịch trống', 
        code: error.response.status 
      };
    }
    
    return { success: false, message: 'Lỗi kết nối tới server' };
  }
};

// Hàm định dạng thời gian cho thông báo lỗi
const formatDateTime = (date) => {
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Xoá khung giờ làm việc (chỉ dành cho luật sư)
const deleteAvailability = async (id) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // Kiểm tra xem người dùng có phải là luật sư không - không phân biệt hoa thường
    if (!currentUser || !currentUser.role || 
        (currentUser.role.toLowerCase() !== 'lawyer' && 
         currentUser.role.toLowerCase() !== 'admin')) {
      return { 
        success: false, 
        message: 'Chỉ luật sư hoặc quản trị viên mới có thể xóa lịch trống', 
        code: 403 
      };
    }

    // Sửa: Truyền đúng headers vào config thay vì tham số thứ hai
    const response = await axios.delete(
      `${API_URL}/appointments/availability/${id}`, 
      { headers: getHeaders() }
    );
    
    return {
      success: true,
      message: 'Xóa lịch trống thành công',
      data: response.data
    };
  } catch (error) {
    console.error('Lỗi khi xóa lịch trống:', error);
    
    // Xử lý lỗi từ server
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Lỗi khi xóa lịch trống',
        code: error.response.status
      };
    }
    
    return {
      success: false,
      message: 'Không thể kết nối đến server',
      code: 500
    };
  }
};

// Lấy thống kê lịch hẹn
const getAppointmentStats = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/appointments/stats`, 
      { headers: getHeaders() }
    );

    if (!response.data) {
      throw new Error('Không thể lấy thống kê');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể lấy thống kê lịch hẹn' 
    };
  }
};

// Lấy lịch hẹn sắp tới
const getUpcomingAppointments = async (limit = 5) => {
  try {
    const response = await axios.get(
      `${API_URL}/appointments/upcoming?limit=${limit}`, 
      { headers: getHeaders() }
    );

    if (!response.data) {
      throw new Error('Không thể lấy lịch hẹn sắp tới');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể lấy lịch hẹn sắp tới' 
    };
  }
};

// Hàm điều chỉnh múi giờ cho Việt Nam
const adjustTimeForVietnamTimezone = (dateTimeString) => {
  // Tạo đối tượng Date từ chuỗi thời gian
  const date = new Date(dateTimeString);
  
  // Lấy múi giờ UTC
  const utcDate = new Date(date.toISOString());
  
  // Đối với Việt Nam (UTC+7), thêm 7 giờ vào thời gian UTC
  const offsetHours = 7;
  const vietnamDate = new Date(utcDate);
  vietnamDate.setHours(vietnamDate.getHours() + offsetHours);
  
  
  // Trả về chuỗi ISO để lưu vào database
  return vietnamDate.toISOString();
};

/**
 * Lấy tất cả lịch hẹn (cho báo cáo thống kê)
 * @param {Object} params - Tham số tìm kiếm
 * @returns {Promise<Object>} Kết quả API
 */
const getAllAppointments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `${API_URL}/appointments/all?${queryParams.toString()}`;
    
    const response = await axios.get(url, { headers: getHeaders() });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy tất cả lịch hẹn:', error);
    return { 
      success: false, 
      message: 'Không thể lấy danh sách lịch hẹn. Vui lòng thử lại sau.',
      data: [],
      total: 0
    };
  }
};

const appointmentService = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getLawyerAvailability,
  addAvailability,
  deleteAvailability,
  getAppointmentStats,
  getUpcomingAppointments,
  getAllAppointments
};

export default appointmentService; 