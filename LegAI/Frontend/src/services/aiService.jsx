const API_KEY = "AIzaSyCvF2ZiBEliIFc729xeqsxYM0VyQkwgVlc";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/constants';

// Thông tin cơ bản về các dịch vụ pháp lý
const LEGAL_SERVICES = {
  civil: 'Tư vấn dân sự: hợp đồng, tranh chấp đất đai, thừa kế, hôn nhân, bồi thường thiệt hại',
  criminal: 'Tư vấn hình sự: bào chữa, bảo vệ quyền lợi, tham gia tố tụng, xin giảm nhẹ hình phạt',
  intellectual: 'Sở hữu trí tuệ: bảo hộ nhãn hiệu, bản quyền, sáng chế, xử lý xâm phạm'
};

// Các thủ tục pháp lý cơ bản
const LEGAL_PROCEDURES = [
  'Đăng ký kết hôn: CMND/CCCD, Giấy xác nhận tình trạng hôn nhân, nộp hồ sơ tại UBND cấp xã', 
  'Ly hôn: nộp đơn tại tòa án nơi bị đơn cư trú, hòa giải, xét xử, thời gian 2-4 tháng',
  'Khai sinh: trong 60 ngày kể từ ngày sinh, mang giấy chứng sinh đến UBND cấp xã',
  'Đăng ký thừa kế: công chứng di chúc tại phòng công chứng, nộp thuế thu nhập cá nhân',
  'Tranh chấp đất đai: hòa giải tại địa phương, khởi kiện tại tòa án có thẩm quyền'
];

// Hàm lấy danh sách luật sư để cung cấp cho AI
const getLawyersData = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/auth/lawyers?limit=5`);
    if (response.data && response.data.data && response.data.data.lawyers) {
      return response.data.data.lawyers.map(lawyer => 
        `${lawyer.fullName} (${lawyer.specialization || 'Chuyên gia pháp lý'}, ${lawyer.rating}/5 sao)`
      ).join('; ');
    }
    return '';
  } catch (error) {
    console.log('Không thể lấy dữ liệu luật sư:', error);
    return '';
  }
};

/**
 * Gửi tin nhắn đến Gemini API và nhận phản hồi
 * @param {string} message - Tin nhắn người dùng
 * @param {Array} history - Lịch sử cuộc trò chuyện (tùy chọn)
 * @returns {Promise<string>} - Phản hồi từ AI
 */
const sendMessageToAI = async (message, history = []) => {
  try {
    // Lấy thông tin luật sư nếu là lần đầu chat
    let systemContext = '';
    if (history.length === 0) {
      const lawyersData = await getLawyersData();
      systemContext = `Bạn là LegAI, trợ lý pháp lý AI. Dịch vụ: ${Object.values(LEGAL_SERVICES).join('. ')}. Thủ tục: ${LEGAL_PROCEDURES.join('. ')}. Luật sư hàng đầu: ${lawyersData}. Trả lời ngắn gọn, súc tích,dễ thương và thân thiện.`;
    }

    // Chuẩn bị lịch sử trò chuyện và thêm context
    const contents = history.length > 0 
      ? [...history, { role: "user", parts: [{ text: message }] }]
      : [
          { role: "model", parts: [{ text: systemContext }] },
          { role: "user", parts: [{ text: message }] }
        ];

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Lỗi khi gọi AI");
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI";
    
    return aiResponse;
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
  }
};

export default {
  sendMessageToAI
}; 