import axios from 'axios';
import { API_URL } from '../config/constants';
import authService from './authService';

// Lấy token xác thực
const getToken = () => {
  return localStorage.getItem('userToken');
};

// Thiết lập headers với token xác thực
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

/**
 * Gửi tin nhắn đến chatbot Rasa và nhận phản hồi
 * @param {string} message - Nội dung tin nhắn của người dùng
 * @param {string} conversationId - ID của cuộc hội thoại (tùy chọn)
 * @returns {Promise<object>} - Phản hồi từ chatbot
 */
const sendMessage = async (message, conversationId = null) => {
  try {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : 'guest';
    
    const payload = {
      message,
      sender_id: conversationId || userId,
      user_info: currentUser || { role: 'guest' }
    };
    
    const response = await axios.post(`${API_URL}/chatbot/message`, payload, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn đến chatbot:', error);
    throw new Error(error.response?.data?.message || 'Không thể kết nối với trợ lý ảo');
  }
};

/**
 * Lấy lịch sử trò chuyện với chatbot
 * @param {string} conversationId - ID của cuộc hội thoại
 * @param {number} limit - Số lượng tin nhắn tối đa (mặc định: 50)
 * @returns {Promise<Array>} - Danh sách tin nhắn
 */
const getChatHistory = async (conversationId, limit = 50) => {
  try {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : 'guest';
    
    const response = await axios.get(`${API_URL}/chatbot/history/${conversationId || userId}`, {
      params: { limit },
      headers: getHeaders()
    });
    
    return response.data.messages || [];
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử trò chuyện:', error);
    return [];
  }
};

/**
 * Thực hiện hành động được yêu cầu bởi chatbot
 * @param {string} action - Tên hành động cần thực hiện
 * @param {object} params - Tham số cho hành động
 * @returns {Promise<object>} - Kết quả của hành động
 */
const executeAction = async (action, params = {}) => {
  try {
    const response = await axios.post(`${API_URL}/chatbot/action`, {
      action,
      params
    }, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi thực hiện hành động ${action}:`, error);
    throw new Error(error.response?.data?.message || `Không thể thực hiện hành động ${action}`);
  }
};

/**
 * Khởi tạo phiên trò chuyện mới với chatbot
 * @returns {Promise<string>} - ID của cuộc hội thoại mới
 */
const startNewConversation = async () => {
  try {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : `guest_${Date.now()}`;
    
    const response = await axios.post(`${API_URL}/chatbot/start`, {
      sender_id: userId,
      user_info: currentUser || { role: 'guest' }
    }, {
      headers: getHeaders()
    });
    
    return response.data.conversation_id || userId;
  } catch (error) {
    console.error('Lỗi khi khởi tạo cuộc trò chuyện mới:', error);
    return `guest_${Date.now()}`;
  }
};

/**
 * Đặt ngữ cảnh cho cuộc trò chuyện hiện tại
 * @param {string} conversationId - ID của cuộc trò chuyện
 * @param {object} context - Thông tin ngữ cảnh (ví dụ: trang hiện tại, dữ liệu người dùng đang xem)
 * @returns {Promise<object>} - Kết quả đặt ngữ cảnh
 */
const setConversationContext = async (conversationId, context) => {
  try {
    const response = await axios.post(`${API_URL}/chatbot/context`, {
      sender_id: conversationId,
      context
    }, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đặt ngữ cảnh cho cuộc trò chuyện:', error);
    return { success: false, error: error.message };
  }
};

export {
  sendMessage,
  getChatHistory,
  executeAction,
  startNewConversation,
  setConversationContext
};

export default {
  sendMessage,
  getChatHistory,
  executeAction,
  startNewConversation,
  setConversationContext
}; 