import axios from 'axios';
import { API_URL } from '../config/constants';
import authService from './authService';

// Lấy token từ localStorage
const getToken = () => {
  return authService.getToken();
};

// Tạo header với token xác thực
const getHeaders = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Tạo phiên chat mới
const createChat = async () => {
  try {
    const response = await axios.post(`${API_URL}/chats`, {}, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo phiên chat:', error);
    throw error;
  }
};

// Lấy danh sách phiên chat của người dùng hiện tại
// (Tự động phân biệt giữa luật sư và khách hàng dựa trên token)
const getChats = async (status = null, page = 1, limit = 10) => {
  try {
    console.log('getChats được gọi với status:', status);
    
    let url = `${API_URL}/chats`;
    const params = new URLSearchParams();
    
    if (status) {
      params.append('status', status);
      console.log(`Thêm tham số status=${status}`);
    }
    
    params.append('page', page);
    params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('URL request:', url);
    console.log('Headers:', getHeaders());
    
    try {
      const response = await axios.get(url, getHeaders());
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phiên chat:', error);
      if (error.response) {
        console.error('Chi tiết lỗi:', error.response.status, error.response.data);
        if (error.response.status === 500) {
          console.error('Lỗi server 500:', error.response.data);
        }
      } else if (error.request) {
        console.error('Không nhận được phản hồi từ server:', error.request);
      }
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiên chat:', error);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.status, error.response.data);
    }
    throw error;
  }
};

// Lấy danh sách phiên chat theo trạng thái (chỉ dành cho admin/luật sư)
const getChatsByStatus = async (status = 'waiting', page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams({
      status,
      page,
      limit
    });
    
    const response = await axios.get(`${API_URL}/chats/status?${params.toString()}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiên chat theo trạng thái:', error);
    throw error;
  }
};

// Gán luật sư vào phiên chat (chỉ dành cho luật sư)
const assignLawyerToChat = async (chatId) => {
  try {
    // Kiểm tra token và vai trò
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Kiểm tra quyền không phân biệt hoa thường
    if (!currentUser || !currentUser.role || 
        (currentUser.role.toLowerCase() !== 'lawyer' && 
         currentUser.role.toLowerCase() !== 'admin')) {
      throw new Error('Chỉ luật sư mới có thể nhận phiên chat');
    }
    
    const response = await axios.put(`${API_URL}/chats/${chatId}/assign`, {}, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gán luật sư vào phiên chat:', error);
    throw error;
  }
};

// Đóng phiên chat
const closeChat = async (chatId) => {
  try {
    // Kiểm tra token và vai trò
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Kiểm tra quyền không phân biệt hoa thường
    if (!currentUser || !currentUser.role || 
        (currentUser.role.toLowerCase() !== 'lawyer' && 
         currentUser.role.toLowerCase() !== 'admin')) {
      throw new Error('Chỉ luật sư mới có thể kết thúc phiên chat');
    }
    
    const response = await axios.put(`${API_URL}/chats/${chatId}/close`, {}, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đóng phiên chat:', error);
    throw error;
  }
};

// Lấy thông tin chi tiết của một phiên chat
const getChatById = async (chatId) => {
  try {
    const response = await axios.get(`${API_URL}/chats/${chatId}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phiên chat:', error);
    throw error;
  }
};

// Gửi tin nhắn mới
const sendMessage = async (chatId, message) => {
  try {
    // Kiểm tra token và vai trò
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Kiểm tra quyền không phân biệt hoa thường
    if (!currentUser || !currentUser.role || 
        (currentUser.role.toLowerCase() !== 'lawyer' && 
         currentUser.role.toLowerCase() !== 'admin' && 
         currentUser.role.toLowerCase() !== 'user')) {
      throw new Error('Bạn không có quyền gửi tin nhắn');
    }
    
    console.log(`Đang gửi tin nhắn đến chat ID ${chatId}:`, message);
    console.log('Headers:', getHeaders());
    
    const response = await axios.post(
      `${API_URL}/chats/${chatId}/messages`, 
      { message }, 
      getHeaders()
    );
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    if (error.response) {
      console.error('Phản hồi lỗi:', error.response.status, error.response.data);
    }
    throw error;
  }
};

// Lấy danh sách tin nhắn của một phiên chat
const getMessages = async (chatId, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams({
      page,
      limit
    });
    
    const response = await axios.get(`${API_URL}/chats/${chatId}/messages?${params.toString()}`, getHeaders());
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tin nhắn:', error);
    throw error;
  }
};

// Đếm số tin nhắn chưa đọc
const countUnreadMessages = async () => {
  try {
    const response = await axios.get(`${API_URL}/chats/unread-count`, getHeaders());
    return response.data.data.unreadCount;
  } catch (error) {
    console.error('Lỗi khi đếm tin nhắn chưa đọc:', error);
    throw error;
  }
};

// Lấy số lượng phiên chat chờ xử lý (chỉ dành cho admin/luật sư)
const getWaitingChatsCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/chats/waiting-count`, getHeaders());
    return response.data.data.waitingCount;
  } catch (error) {
    console.error('Lỗi khi đếm phiên chat chờ xử lý:', error);
    throw error;
  }
};

// Định dạng thời gian
const formatChatTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  // Hàm để thêm số 0 đằng trước nếu cần
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  
  if (isToday) {
    return `${hours}:${minutes}`;
  } else {
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    return `${day}/${month} ${hours}:${minutes}`;
  }
};

export default {
  createChat,
  getChats,
  getChatsByStatus,
  assignLawyerToChat,
  closeChat,
  getChatById,
  sendMessage,
  getMessages,
  countUnreadMessages,
  getWaitingChatsCount,
  formatChatTime
}; 