import axios from 'axios';
import { API_URL } from '../config/constants';

/**
 * Gửi email OTP đến người dùng
 * @param {string} email - Email của người dùng
 * @param {string} username - Tên người dùng
 * @param {string} otp - Mã OTP
 * @returns {Promise} - Promise trả về kết quả của request
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
    console.error('Lỗi khi gửi email OTP:', error);
    throw error;
  }
};

/**
 * Gửi email đặt lại mật khẩu đến người dùng
 * @param {string} email - Email của người dùng
 * @param {string} username - Tên người dùng
 * @param {string} otp - Mã OTP
 * @returns {Promise} - Promise trả về kết quả của request
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
    console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
    throw error;
  }
};

/**
 * Gửi email liên hệ từ form liên hệ
 * @param {Object} contactData - Dữ liệu liên hệ
 * @param {string} contactData.email - Email của người gửi
 * @param {string} contactData.name - Tên của người gửi
 * @param {string} contactData.subject - Tiêu đề của email
 * @param {string} contactData.message - Nội dung của email
 * @returns {Promise} - Promise trả về kết quả của request
 */
const sendContactEmail = async (contactData) => {
  try {
    const response = await axios.post(`${API_URL}/mail/send-contact`, contactData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi email liên hệ:', error);
    throw error;
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
    console.error('Lỗi gửi email thông báo hủy hẹn:', error);
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
    console.error('Lỗi gửi email thông báo cập nhật trạng thái cuộc hẹn:', error);
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