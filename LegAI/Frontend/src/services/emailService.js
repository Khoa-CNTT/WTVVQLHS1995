import axios from 'axios';
import { API_URL } from '../config/constants';

/**
 * Gửi email xác minh bằng cách gọi API Backend
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} username - Tên người dùng
 * @param {string} otp - Mã OTP
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendOTPEmail = async (email, username, otp) => {
  try {
    const response = await axios.post(`${API_URL}/mail/send-verification`, {
      email,
      username,
      otp
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email OTP:', error);
    throw new Error(error.response?.data?.message || `Lỗi gửi email: ${error.message}`);
  }
};

/**
 * Gửi email đặt lại mật khẩu bằng cách gọi API Backend
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} username - Tên người dùng
 * @param {string} otp - Mã OTP
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendPasswordResetEmail = async (email, username, otp) => {
  try {
    const response = await axios.post(`${API_URL}/mail/send-password-reset`, {
      email,
      username,
      otp
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email đặt lại mật khẩu:', error);
    throw new Error(error.response?.data?.message || `Lỗi gửi email: ${error.message}`);
  }
};

/**
 * Gửi email liên hệ từ form liên hệ
 * @param {object} contactData - Thông tin liên hệ, bao gồm {name, email, subject, message}
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendContactEmail = async (contactData) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      throw new Error('Vui lòng cung cấp đầy đủ thông tin liên hệ');
    }
    
    const response = await axios.post(`${API_URL}/mail/send-contact`, contactData);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email liên hệ:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Không thể gửi email liên hệ');
    } else {
      throw new Error(`Lỗi gửi email: ${error.message}`);
    }
  }
};

/**
 * Gửi email xác nhận cho người dùng sau khi họ gửi form liên hệ
 * @param {Object} contactData - Dữ liệu người dùng gửi email xác nhận
 * @param {string} contactData.email - Email của người gửi
 * @param {string} contactData.name - Tên của người gửi
 * @param {string} contactData.subject - Tiêu đề của email liên hệ
 * @returns {Promise} - Promise trả về kết quả của request
 */
const sendContactConfirmationEmail = async (contactData) => {
  try {
    const response = await axios.post(`${API_URL}/mail/send-contact-confirmation`, contactData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận liên hệ:', error);
    throw error;
  }
};

/**
 * Gửi email xác nhận đặt hẹn
 * @param {object} appointmentData - Thông tin cuộc hẹn
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendAppointmentConfirmation = async (appointmentData) => {
  try {
    const response = await axios.post(`${API_URL}/mail/appointment-confirmation`, appointmentData);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email xác nhận đặt hẹn:', error);
    throw new Error(error.response?.data?.message || `Lỗi gửi email: ${error.message}`);
  }
};

/**
 * Gửi email thông báo hủy cuộc hẹn
 * @param {object} appointmentData - Thông tin cuộc hẹn
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendAppointmentCancellation = async (appointmentData) => {
  try {
    const response = await axios.post(`${API_URL}/mail/appointment-cancellation`, appointmentData);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email thông báo hủy cuộc hẹn:', error);
    throw new Error(error.response?.data?.message || `Lỗi gửi email: ${error.message}`);
  }
};

/**
 * Gửi email thông báo cập nhật trạng thái cuộc hẹn
 * @param {object} appointmentData - Thông tin cuộc hẹn
 * @returns {Promise<object>} - Kết quả gửi email
 */
const sendAppointmentStatusUpdate = async (appointmentData) => {
  try {
    const response = await axios.post(`${API_URL}/mail/appointment-status-update`, appointmentData);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi gửi email thông báo cập nhật trạng thái:', error);
    throw new Error(error.response?.data?.message || `Lỗi gửi email: ${error.message}`);
  }
};

export { 
  sendOTPEmail, 
  sendPasswordResetEmail, 
  sendContactEmail,
  sendContactConfirmationEmail,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentStatusUpdate
};