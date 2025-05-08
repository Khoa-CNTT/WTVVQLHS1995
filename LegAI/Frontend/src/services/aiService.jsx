import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/constants';

// Kiểm tra URL API
console.log('KHỞI TẠO AISERVICE - URL API:', BASE_API_URL);

// URL của Ollama API với qwen2.5-3b
const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const MODEL_NAME = "qwen2.5:3b";

// Khóa lưu trữ cho localStorage
const CHAT_HISTORY_KEY = 'legai_chat_history';

// Lưu lịch sử chat vào localStorage
const saveChatHistory = (history) => {
  try {
    console.log('Đang lưu lịch sử chat vào localStorage:', history);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    // Kiểm tra lại ngay sau khi lưu để xác nhận
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      console.log('Đã lưu lịch sử chat thành công, kích thước:', saved.length);
    } else {
      console.error('Lưu lịch sử thất bại: không tìm thấy dữ liệu sau khi lưu');
    }
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử chat:", error);
  }
};

// Lấy lịch sử chat từ localStorage
const getChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      return parsedHistory;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Lỗi khi đọc lịch sử chat:", error);
    return [];
  }
};

// Xóa lịch sử chat
const clearChatHistory = () => {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa lịch sử chat:", error);
    return false;
  }
};

// Lấy token từ localStorage
const getToken = () => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.token || localStorage.getItem('token');
  } catch (error) {
    console.error('Lỗi khi lấy token:', error);
    return null;
  }
};

// Hàm tạo headers với token xác thực
const getHeaders = () => {
  const token = getToken();
  if (!token) {
    console.warn('Không tìm thấy token xác thực');
  }
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

/**
 * Gửi tin nhắn đến API và nhận phản hồi (sử dụng RAG)
 * @param {string} message - Tin nhắn người dùng
 * @param {Array} history - Lịch sử cuộc trò chuyện (tùy chọn)
 * @returns {Promise<Object|string>} - Phản hồi từ AI
 */
const sendMessageToAI = async (message, history = []) => {
  try {
    // Nếu không có lịch sử được truyền vào, lấy từ localStorage
    const chatHistory = history.length > 0 ? history : getChatHistory();
    console.log('Lịch sử chat trước khi gửi tin nhắn mới:', chatHistory.length, 'tin nhắn');
    
    // Lấy token và kiểm tra
    const token = getToken();
    if (!token) {
      console.warn('CẢNH BÁO: Không có token xác thực - tin nhắn có thể không được lưu vào database!');
    } else {
      console.log('Đã tìm thấy token, độ dài:', token.length);
    }
    
    console.log('Đang gửi câu hỏi đến API:', message);
    
    // Chuẩn bị request config
    const config = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      timeout: 60000 // Tăng timeout lên 60 giây
    };
    
    console.log('Headers gửi đi:', config.headers);
    
    // Gọi API backend với RAG để có câu trả lời chính xác hơn
    console.log('Bắt đầu gọi API tại:', new Date().toISOString());
    const response = await axios.post(`${BASE_API_URL}/ai/ask`, {
      question: message,
      options: {
        temperature: 0.3,
        top_p: 0.95,
        top_k: 40,
        topK: 5
      }
    }, config);
    
    console.log('Đã nhận phản hồi từ API tại:', new Date().toISOString());
    
    if (response.data && response.data.success) {
      const apiData = response.data;
      const aiResponse = apiData.data.answer;
      
      console.log('Đã nhận phản hồi từ AI, độ dài:', aiResponse.length);
      console.log('Thông tin lưu vào DB:', {
        saved: apiData.saved_to_db ? 'Thành công' : 'Thất bại',
        recordId: apiData.db_record_id || 'Không có',
        error: apiData.db_error || 'Không có lỗi'
      });
      
      // Lưu tin nhắn người dùng và phản hồi của AI vào lịch sử
      const updatedHistory = [...chatHistory, 
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: aiResponse }] }
      ];
      
      console.log('Lịch sử chat sau khi cập nhật:', updatedHistory.length, 'tin nhắn');
      
      // Lưu lịch sử vào localStorage
      saveChatHistory(updatedHistory);
      
      // Trả về cả nội dung và thông tin lưu DB
      return {
        text: aiResponse,
        saved_to_db: apiData.saved_to_db || false,
        db_record_id: apiData.db_record_id,
        db_error: apiData.db_error
      };
    } else {
      console.error('API trả về lỗi hoặc không có success:', response.data);
      throw new Error(response.data?.message || "API không trả về dữ liệu thành công");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error.message);
    
    // Ghi log chi tiết lỗi
    if (error.response) {
      console.error("Lỗi từ server:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Không nhận được phản hồi từ server:", error.request);
    }
    
    // Nếu API backend không khả dụng, dùng Ollama trực tiếp làm backup (không có RAG)
    console.log('Chuyển sang sử dụng API Ollama dự phòng');
    try {
      // Đảm bảo sử dụng lại chatHistory đã định nghĩa ở scope ngoài
      const localChatHistory = history.length > 0 ? history : getChatHistory();
      
      const messages = [
        {
          role: "system",
          content: "Bạn là LegAI - trợ lý pháp lý thông minh. Bạn giúp trả lời các câu hỏi về pháp luật Việt Nam. Nếu không biết câu trả lời, hãy thành thật nói rằng bạn không có thông tin đầy đủ và khuyên người dùng tham khảo các nguồn chính thức."
        }
      ];
      
      // Thêm lịch sử trò chuyện nếu có
      if (localChatHistory.length > 0) {
        localChatHistory.forEach(msg => {
          messages.push({
            role: msg.role === "model" ? "assistant" : msg.role,
            content: msg.parts[0].text
          });
        });
      }
      
      // Thêm tin nhắn hiện tại của người dùng
      messages.push({
        role: "user",
        content: message
      });

      console.log('Gửi yêu cầu đến Ollama với', messages.length, 'tin nhắn');
      
      // Gọi API của Ollama để tạo phản hồi
      const ollamaResponse = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7, 
            top_p: 0.9,
            top_k: 40
          }
        }),
      });

      if (!ollamaResponse.ok) {
        console.error('Ollama trả về lỗi:', ollamaResponse.status, ollamaResponse.statusText);
        throw new Error("Lỗi khi gọi API Ollama");
      }

      const data = await ollamaResponse.json();
      const fallbackResponse = data.message?.content || "Không có phản hồi từ AI";
      console.log('Đã nhận phản hồi từ Ollama, độ dài:', fallbackResponse.length);
      
      // Lưu tin nhắn người dùng và phản hồi của AI vào lịch sử
      const updatedHistory = [...localChatHistory, 
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: fallbackResponse }] }
      ];
      
      // Lưu lịch sử vào localStorage
      console.log('Lưu lịch sử Ollama vào localStorage:', updatedHistory.length, 'tin nhắn');
      saveChatHistory(updatedHistory);
      
      console.log('Đã sử dụng Ollama vì API backend không khả dụng. Lưu ý: Tin nhắn sẽ không được lưu vào database.');
      
      return {
        text: fallbackResponse,
        saved_to_db: false,
        using_fallback: true,
        db_error: 'Sử dụng Ollama fallback, không lưu vào database'
      };
    } catch (fallbackError) {
      console.error("Lỗi khi gọi API Ollama:", fallbackError);
      throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
    }
  }
};

/**
 * Lấy danh sách tư vấn AI từ tất cả người dùng
 * @param {Object} options - Các tùy chọn lọc: page, limit, search, userId
 * @returns {Promise<Object>} - Danh sách tư vấn AI
 */
const getAllAIConsultations = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search = '', userId = null } = options;
    
    let url = `${BASE_API_URL}/ai/consultations?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (userId) {
      url += `&userId=${userId}`;
    }
    
    const response = await axios.get(url, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tư vấn AI:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một tư vấn AI
 * @param {number} id - ID của tư vấn AI cần lấy
 * @returns {Promise<Object>} - Chi tiết tư vấn AI
 */
const getAIConsultationById = async (id) => {
  try {
    const response = await axios.get(`${BASE_API_URL}/ai/consultations/${id}`, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết tư vấn AI với ID ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo một tư vấn AI mới
 * @param {Object} consultationData - Dữ liệu tư vấn mới
 * @returns {Promise<Object>} - Tư vấn AI vừa tạo
 */
const createAIConsultation = async (consultationData) => {
  try {
    const response = await axios.post(`${BASE_API_URL}/ai/consultations`, consultationData, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo tư vấn AI mới:', error);
    throw error;
  }
};

/**
 * Cập nhật một tư vấn AI
 * @param {number} id - ID của tư vấn AI cần cập nhật
 * @param {Object} consultationData - Dữ liệu cập nhật
 * @returns {Promise<Object>} - Tư vấn AI đã cập nhật
 */
const updateAIConsultation = async (id, consultationData) => {
  try {
    const response = await axios.put(`${BASE_API_URL}/ai/consultations/${id}`, consultationData, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật tư vấn AI với ID ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa một tư vấn AI
 * @param {number} id - ID của tư vấn AI cần xóa
 * @returns {Promise<Object>} - Kết quả xóa
 */
const deleteAIConsultation = async (id) => {
  try {
    const response = await axios.delete(`${BASE_API_URL}/ai/consultations/${id}`, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa tư vấn AI với ID ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy lịch sử chat AI từ server dựa trên user ID
 * @param {number} userId - ID của người dùng cần lấy lịch sử
 * @returns {Promise<Object>} - Lịch sử chat
 */
const getAIChatHistoryByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_API_URL}/ai/chat-history/${userId}`, {
      headers: getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat theo user ID:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử chat AI của người dùng hiện tại
 * @returns {Promise<Object>} - Lịch sử chat
 */
const getMyAIChatHistory = async () => {
  try {
    // Kiểm tra xem có token không trước khi gọi API
    const token = getToken();
    if (!token) {
      console.warn('Không có token xác thực để lấy lịch sử chat.');
      return { success: false, message: 'Bạn cần đăng nhập để xem lịch sử chat' };
    }

    console.log('Bắt đầu lấy lịch sử chat từ server...');
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 giây timeout
    };
    
    console.log('Headers request:', config.headers);
    const response = await axios.get(`${BASE_API_URL}/ai/my-chat-history`, config);
    
    console.log('Phản hồi lịch sử chat từ server:', {
      success: response.data.success,
      count: response.data.count || 0,
      dataLength: response.data.data ? response.data.data.length : 0
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat cá nhân:', error);
    
    // Kiểm tra lỗi cụ thể
    if (error.response) {
      // Server trả về lỗi với mã trạng thái
      console.error('Mã lỗi HTTP:', error.response.status);
      console.error('Thông báo từ server:', error.response.data);
      
      if (error.response.status === 401) {
        return { success: false, message: 'Bạn cần đăng nhập lại để xem lịch sử chat' };
      }
      
      // Trả về thông báo lỗi từ server nếu có
      if (error.response.data && error.response.data.message) {
        return { 
          success: false, 
          message: error.response.data.message,
          httpStatus: error.response.status
        };
      }
    } else if (error.request) {
      // Yêu cầu được gửi nhưng không nhận được phản hồi
      console.error('Không nhận được phản hồi từ server:', error.request);
      return { 
        success: false, 
        message: 'Máy chủ không phản hồi, vui lòng thử lại sau',
        networkError: true
      };
    }
    
    // Lỗi mặc định
    return { 
      success: false, 
      message: 'Không thể kết nối đến server để lấy lịch sử chat',
      error: error.message
    };
  }
};

export default {
  sendMessageToAI,
  getChatHistory,
  clearChatHistory,
  getAllAIConsultations,
  getAIConsultationById,
  createAIConsultation,
  updateAIConsultation,
  deleteAIConsultation,
  getAIChatHistoryByUserId,
  getMyAIChatHistory
}; 