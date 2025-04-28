import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/constants';

// URL của Ollama API với qwen2.5-3b
const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const MODEL_NAME = "qwen2.5:3b";

// Khóa lưu trữ cho localStorage
const CHAT_HISTORY_KEY = 'legai_chat_history';

// Lưu lịch sử chat vào localStorage
const saveChatHistory = (history) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử chat:", error);
  }
};

// Lấy lịch sử chat từ localStorage
const getChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    return savedHistory ? JSON.parse(savedHistory) : [];
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

/**
 * Gửi tin nhắn đến API và nhận phản hồi (sử dụng RAG)
 * @param {string} message - Tin nhắn người dùng
 * @param {Array} history - Lịch sử cuộc trò chuyện (tùy chọn)
 * @returns {Promise<string>} - Phản hồi từ AI
 */
const sendMessageToAI = async (message, history = []) => {
  try {
    // Nếu không có lịch sử được truyền vào, lấy từ localStorage
    const chatHistory = history.length > 0 ? history : getChatHistory();
    
    // Gọi API backend với RAG để có câu trả lời chính xác hơn
    const response = await axios.post(`${BASE_API_URL}/ai/ask`, {
      question: message,
      options: {
        temperature: 0.3,
        top_p: 0.95,
        top_k: 40,
        topK: 5
      }
    });
    
    if (response.data && response.data.success) {
      const aiResponse = response.data.data.answer;
      
      // Lưu tin nhắn người dùng và phản hồi của AI vào lịch sử
      const updatedHistory = [...chatHistory, 
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: aiResponse }] }
      ];
      
      // Lưu lịch sử vào localStorage
      saveChatHistory(updatedHistory);
      
      return aiResponse;
    } else {
      throw new Error(response.data?.message || "Lỗi không xác định từ API");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);

    // Nếu API backend không khả dụng, dùng Ollama trực tiếp làm backup (không có RAG)
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
        throw new Error("Lỗi khi gọi API Ollama");
      }

      const data = await ollamaResponse.json();
      const fallbackResponse = data.message?.content || "Không có phản hồi từ AI";
      
      // Lưu tin nhắn người dùng và phản hồi của AI vào lịch sử
      const updatedHistory = [...localChatHistory, 
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text: fallbackResponse }] }
      ];
      
      // Lưu lịch sử vào localStorage
      saveChatHistory(updatedHistory);
      
      return fallbackResponse;
    } catch (fallbackError) {
      console.error("Lỗi khi gọi API Ollama:", fallbackError);
      throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
    }
  }
};

export default {
  sendMessageToAI,
  getChatHistory,
  clearChatHistory
}; 