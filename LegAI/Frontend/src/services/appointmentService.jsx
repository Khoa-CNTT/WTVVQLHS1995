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

    console.log('createAppointment - Dữ liệu đầu vào:', appointmentData);

    // Chuẩn bị dữ liệu cho appointment
    const appointment = {
      customer_id: appointmentData.customer_id,
      lawyer_id: appointmentData.lawyer_id,
      start_time: new Date(appointmentData.start_time).toISOString(),
      end_time: new Date(appointmentData.end_time).toISOString(),
      status: 'pending',
      purpose: appointmentData.purpose || '',
      notes: appointmentData.notes || ''
    };

    console.log('Gửi dữ liệu tạo lịch hẹn:', appointment);

    // Tạo cuộc hẹn mới
    try {
      const response = await axios.post(
        `${API_URL}/appointments`, 
        appointment, 
        { headers: getHeaders() }
      );

      console.log('Phản hồi từ API khi tạo lịch hẹn:', response.data);
  
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
    
    console.log(`Lấy lịch hẹn với vai trò: ${isLawyer ? 'luật sư' : 'khách hàng'}, ID: ${currentUser.id}`);
    
    const url = status ? 
      `${API_URL}/appointments?status=${status}` : 
      `${API_URL}/appointments`;
    
    console.log(`Gọi API: ${url}`);
    const response = await axios.get(url, { headers: getHeaders() });
    
    if (!response.data) {
      console.error('API trả về dữ liệu không hợp lệ');
      throw new Error('Không thể lấy danh sách lịch hẹn');
    }

    console.log(`Nhận được ${response.data.data?.length || 0} lịch hẹn từ API`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể lấy danh sách lịch hẹn' 
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
    console.log(`Huỷ lịch hẹn ID ${id} với lý do: "${cancelReason}"`);

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
    
    console.log('Huỷ lịch hẹn thành công');
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

    console.log('Đang lấy lịch trống cho luật sư ID:', lawyerId);
    
    const response = await axios.get(
      `${API_URL}/appointments/lawyer/${lawyerId}/availability`,
      { headers: getHeaders() }
    );

    console.log('Phản hồi API getLawyerAvailability:', response.data);

    // DEBUG: Kiểm tra chi tiết từng slot trong dữ liệu trả về
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('DEBUG - Chi tiết các slot từ API:');
      response.data.data.forEach((slot, index) => {
        console.log(`Slot #${index + 1} - ID: ${slot.id}`);
        console.log(`- Status: "${slot.status}"`);
        console.log(`- Start: ${new Date(slot.start_time).toLocaleString()}`);
        console.log(`- End: ${new Date(slot.end_time).toLocaleString()}`);
      });
    } else if (response.data && Array.isArray(response.data)) {
      console.log('DEBUG - Chi tiết các slot từ API (direct array):');
      response.data.forEach((slot, index) => {
        console.log(`Slot #${index + 1} - ID: ${slot.id}`);
        console.log(`- Status: "${slot.status}"`);
        console.log(`- Start: ${new Date(slot.start_time).toLocaleString()}`);
        console.log(`- End: ${new Date(slot.end_time).toLocaleString()}`);
      });
    }

    // Kiểm tra và chuẩn hóa phản hồi
    if (response.data) {
      // Trường hợp 1: API trả về đúng định dạng { status, data }
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        return {
          status: 'success',
          data: response.data.data,
          message: 'Lấy lịch trống thành công'
        };
      }
      
      // Trường hợp 2: API trả về trực tiếp mảng dữ liệu
      if (Array.isArray(response.data)) {
        return {
          status: 'success',
          data: response.data,
          message: 'Lấy lịch trống thành công'
        };
      }
      
      // Trường hợp 3: API trả về dữ liệu không đúng định dạng
      console.warn('API trả về định dạng không mong đợi:', response.data);
      return {
        status: 'success',
        data: [],
        message: 'Luật sư chưa có lịch trống'
      };
    }
    
    // Trường hợp 4: response.data là null hoặc undefined
    console.warn('API trả về dữ liệu null hoặc undefined');
    return {
      status: 'error',
      data: [],
      message: 'Không thể lấy lịch trống'
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
      status: 'error', 
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

    const startTime = new Date(availabilityData.start_time);
    const endTime = new Date(availabilityData.end_time);
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // Kiểm tra xem người dùng có phải là luật sư không
    if (!currentUser || !currentUser.role || currentUser.role.toLowerCase() !== 'lawyer') {
      console.log('Người dùng không phải là luật sư:', currentUser);
      return { success: false, message: 'Chỉ luật sư mới có thể thêm lịch trống', code: 403 };
    }

    // Thêm thông tin vai trò vào dữ liệu gửi đi
    const dataToSend = {
      ...availabilityData,
      user_role: 'lawyer',
    };

    // Kiểm tra xem có slot trùng không
    const existingSlots = await getLawyerAvailability(availabilityData.lawyer_id);
    console.log('Lịch trống hiện tại khi kiểm tra trùng lặp:', existingSlots);
    
    // Chỉ kiểm tra nếu có dữ liệu
    if (existingSlots && existingSlots.status === 'success' && Array.isArray(existingSlots.data) && existingSlots.data.length > 0) {
      const hasOverlap = existingSlots.data.some(slot => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);
        return (startTime < slotEnd && endTime > slotStart);
      });

      if (hasOverlap) {
        return { 
          success: false, 
          message: `Lịch trống bị trùng với slot đã tồn tại trong khoảng từ ${formatDateTime(startTime)} đến ${formatDateTime(endTime)}` 
        };
      }
    }

    console.log('Gửi dữ liệu thêm lịch trống:', dataToSend);
    const response = await axios.post(
      `${API_URL}/appointments/availability`,
      dataToSend,
      { headers: getHeaders() }
    );
    
    console.log('Phản hồi khi thêm lịch trống:', response.data);

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
    if (!id) {
      return {
        status: 'error',
        message: 'ID không hợp lệ'
      };
    }

    // Bỏ phần kiểm tra lịch hẹn vì có thể không cần hoặc gây lỗi
    // Gửi yêu cầu xóa trực tiếp
    const response = await axios.delete(
      `${API_URL}/appointments/availability/${id}`, 
      { headers: getHeaders() }
    );

    console.log('Phản hồi khi xóa lịch trống:', response.data);

    // Xử lý đúng định dạng phản hồi
    if (response.data && response.data.status === 'success') {
      return {
        status: 'success',
        data: response.data.data || {}
      };
    } else {
      return {
        status: 'error',
        message: response.data?.message || 'Không thể xóa lịch làm việc'
      };
    }
  } catch (error) {
    console.error('Lỗi khi xóa lịch trống:', error);
    return { 
      status: 'error', 
      message: error.response?.data?.message || error.message || 'Không thể xoá lịch làm việc'
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
  getUpcomingAppointments
};

export default appointmentService; 