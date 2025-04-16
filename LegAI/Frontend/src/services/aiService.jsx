const API_KEY = "AIzaSyBeSbDIfNps07XyGzamYJTjwflaA-hlppQ";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent";

/**
 * Gửi tin nhắn đến Gemini API và nhận phản hồi
 * @param {string} message - Tin nhắn người dùng
 * @param {Array} history - Lịch sử cuộc trò chuyện (tùy chọn)
 * @returns {Promise<string>} - Phản hồi từ AI
 */
const sendMessageToAI = async (message, history = []) => {
  try {
    // Chuẩn bị lịch sử trò chuyện nếu có
    const contents = history.length > 0 
      ? [...history, { role: "user", parts: [{ text:'Bạn là LegAI một trợ lý AI về WEBSITE TƯ VẤN VÀ QUẢN LÝ HỒ SƠ PHÁP LÝ TÍCH HỢP AI ĐỂ NÂNG CAO HIỆU QUẢ TRA CỨU, Hãy nói chuyện ngắn gọn, không xuống dòng nhiều nếu chỉ hỏi đơn giản và hài hước với người dùng nhé! sau đây là các yêu cầu của người dùng: '+ message }] }]
      : [{ role: "user", parts: [{ text: message }] }];

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