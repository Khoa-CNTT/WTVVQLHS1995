import axios from 'axios';
import { API_URL } from '../config/constants';

// Lấy token
const getToken = () => {
  return localStorage.getItem('token');
};

// Thiết lập header
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

// Tạo lịch hẹn mới
const createAppointment = async (appointmentData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!appointmentData.lawyer_id || !appointmentData.customer_id || 
        !appointmentData.start_time || !appointmentData.end_time) {
      throw new Error('Thiếu thông tin bắt buộc cho cuộc hẹn');
    }

    // Kiểm tra xem luật sư có lịch trống không
    const availabilityResponse = await axios.get(
      `${API_URL}/appointments/lawyer/${appointmentData.lawyer_id}/availability`,
      getHeaders()
    );

    if (!availabilityResponse.data || !Array.isArray(availabilityResponse.data)) {
      throw new Error('Không thể kiểm tra lịch trống của luật sư');
    }

    const availableSlots = availabilityResponse.data;
    const appointmentStart = new Date(appointmentData.start_time);
    const appointmentEnd = new Date(appointmentData.end_time);

    const isSlotAvailable = availableSlots.some(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);
      return appointmentStart >= slotStart && appointmentEnd <= slotEnd && slot.status === 'available';
    });

    if (!isSlotAvailable) {
      throw new Error('Khung giờ này không có sẵn');
    }

    // Chuẩn bị dữ liệu cho appointment
    const appointment = {
      customer_id: appointmentData.customer_id,
      lawyer_id: appointmentData.lawyer_id,
      start_time: appointmentStart.toISOString(),
      end_time: appointmentEnd.toISOString(),
      status: 'pending',
      purpose: appointmentData.purpose || '',
      notes: appointmentData.notes || ''
    };

    // Tạo cuộc hẹn mới
    const response = await axios.post(
      `${API_URL}/appointments`, 
      appointment, 
      getHeaders()
    );

    if (!response.data || response.data.status === 'error') {
      throw new Error(response.data?.message || 'Không thể tạo lịch hẹn');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: error.message || 'Không thể tạo lịch hẹn' 
    };
  }
};

// Lấy danh sách lịch hẹn
const getAppointments = async (status = null) => {
  try {
    const url = status ? 
      `${API_URL}/appointments?status=${status}` : 
      `${API_URL}/appointments`;
    
    const response = await axios.get(url, getHeaders());
    
    if (!response.data) {
      throw new Error('Không thể lấy danh sách lịch hẹn');
    }

    return response.data;
  } catch (error) {
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
      getHeaders()
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
      getHeaders()
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
      throw new Error('ID lịch hẹn không hợp lệ');
    }

    const response = await axios.delete(
      `${API_URL}/appointments/${id}`, 
      { 
        ...getHeaders(),
        data: { reason }
      }
    );

    if (!response.data || response.data.status === 'error') {
      throw new Error('Không thể hủy lịch hẹn');
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể huỷ lịch hẹn' 
    };
  }
};

// Lấy khung giờ làm việc của luật sư
const getLawyerAvailability = async (lawyerId) => {
  try {
    if (!lawyerId) {
      throw new Error('ID luật sư không hợp lệ');
    }

    const response = await axios.get(
      `${API_URL}/appointments/lawyer/${lawyerId}/availability`,
      getHeaders()
    );

    if (!response.data) {
      throw new Error('Không thể lấy lịch làm việc');
    }

    // Lọc chỉ lấy các slot còn trống và trong tương lai
    const now = new Date();
    const availableSlots = Array.isArray(response.data) ? 
      response.data.filter(slot => {
        const slotStart = new Date(slot.start_time);
        return slotStart > now && slot.status === 'available';
      }) : [];

    return {
      status: 'success',
      data: availableSlots
    };
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: 'Không thể lấy lịch làm việc của luật sư' 
    };
  }
};

// Thêm khung giờ làm việc (chỉ dành cho luật sư)
const addAvailability = async (availabilityData) => {
  try {
    // Validate dữ liệu đầu vào
    if (!availabilityData.lawyer_id || !availabilityData.start_time || !availabilityData.end_time) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    const startTime = new Date(availabilityData.start_time);
    const endTime = new Date(availabilityData.end_time);
    const now = new Date();

    if (startTime <= now) {
      throw new Error('Thời gian bắt đầu phải sau thời điểm hiện tại');
    }

    if (endTime <= startTime) {
      throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    // Kiểm tra trùng lặp
    const existingResponse = await getLawyerAvailability(availabilityData.lawyer_id);
    const existingSlots = existingResponse.data || [];

    const isOverlap = existingSlots.some(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);
      return (startTime < slotEnd && endTime > slotStart);
    });

    if (isOverlap) {
      throw new Error('Khung giờ này đã tồn tại');
    }

    // Chuẩn bị dữ liệu
    const availability = {
      lawyer_id: availabilityData.lawyer_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'available'
    };

    // Gọi API
    const response = await axios.post(
      `${API_URL}/appointments/availability`, 
      availability, 
      getHeaders()
    );

    if (!response.data || response.data.status === 'error') {
      throw new Error(response.data?.message || 'Không thể thêm lịch làm việc');
    }

    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: error.message || 'Không thể thêm lịch làm việc' 
    };
  }
};

// Xoá khung giờ làm việc (chỉ dành cho luật sư)
const deleteAvailability = async (id) => {
  try {
    if (!id) {
      throw new Error('ID không hợp lệ');
    }

    // Kiểm tra xem có lịch hẹn nào trong khung giờ này không
    const checkResponse = await axios.get(
      `${API_URL}/appointments/availability/${id}`,
      getHeaders()
    );

    if (checkResponse.data?.appointments?.length > 0) {
      throw new Error('Không thể xóa khung giờ này vì đã có lịch hẹn');
    }

    const response = await axios.delete(
      `${API_URL}/appointments/availability/${id}`, 
      getHeaders()
    );

    if (!response.data || response.data.status === 'error') {
      throw new Error('Không thể xóa lịch làm việc');
    }

    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    throw error.response?.data || { 
      status: 'error', 
      message: error.message || 'Không thể xoá lịch làm việc' 
    };
  }
};

// Lấy thống kê lịch hẹn
const getAppointmentStats = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/appointments/stats`, 
      getHeaders()
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
      getHeaders()
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