const axios = require('axios');

// URL của Ollama API
const OLLAMA_API_URL = "http://localhost:11434/api/chat";

// Tên mô hình
const MODEL_NAME = "qwen2.5:3b";

/**
 * Gửi câu hỏi đến Ollama API và nhận câu trả lời
 * @param {string} prompt - Câu hỏi hoặc prompt để gửi đến Ollama
 * @param {Array} documents - Tài liệu liên quan từ RAG
 * @param {Object} options - Các tùy chọn cho mô hình
 * @returns {Promise<string>} - Câu trả lời từ mô hình
 */
const generateResponse = async (prompt, documents = [], options = {}) => {
  try {
    // Kiểm tra xem câu hỏi có phải là lời chào đơn giản không
    const greetingPatterns = [
      /^(xin\s*)?ch[aà]o(\s*\w*)*$/i,
      /^hi(\s*\w*)*$/i,
      /^hello(\s*\w*)*$/i,
      /^hey(\s*\w*)*$/i,
      /^hola(\s*\w*)*$/i,
      /^xin\s*ch[aà]o(\s*\w*)*$/i
    ];
    
    // Xử lý lời chào đơn giản
    if (greetingPatterns.some(pattern => pattern.test(prompt.trim()))) {
      return "Chào bạn! Tôi là trợ lý AI pháp luật. Tôi có thể giúp bạn giải đáp các thắc mắc về pháp luật Việt Nam. Bạn cần tư vấn về vấn đề pháp lý nào?";
    }
    
    // Kiểm tra xem câu hỏi có phải là phản hồi thông thường không
    const casualResponsePatterns = [
      {
        pattern: /^(ok|okay|ừ|ừm|um|à|uh|vâng|đúng rồi|đúng|được|đồng ý|hay|tốt)(\s+\w*)*$/i,
        response: "Tôi rất vui khi có thể giúp được bạn. Bạn còn câu hỏi nào khác không?"
      },
      {
        pattern: /^(cảm ơn|thank|thanks|cám ơn|cám|hiểu rồi)(\s+\w*)*$/i,
        response: "Không có gì. Tôi luôn sẵn sàng hỗ trợ bạn về các vấn đề pháp lý. Bạn có câu hỏi nào khác không?"
      },
      {
        pattern: /^(hay|tuyệt|giỏi|good|great|excellent|tốt|khá|wow)(\s+\w*)*$/i,
        response: "Cảm ơn bạn! Tôi luôn cố gắng cung cấp thông tin hữu ích. Bạn cần tư vấn thêm về vấn đề gì không?"
      },
      {
        pattern: /^(không|no|nope|ko|k|đủ|đủ rồi)(\s+\w*)*$/i,
        response: "Vâng, nếu bạn cần hỗ trợ gì thêm, đừng ngần ngại quay lại và đặt câu hỏi nhé!"
      },
      {
        pattern: /dài quá|ngắn lại|ngắn gọn|tóm tắt|quá dài|nhiều quá/i,
        response: "Xin lỗi! Tôi sẽ cố gắng trả lời ngắn gọn hơn trong các câu trả lời tiếp theo."
      },
      {
        pattern: /ngu|kém|không biết gì|chả biết gì|tệ|tệ quá/i,
        response: "Tôi xin lỗi nếu câu trả lời của tôi chưa đáp ứng được mong đợi của bạn. Tôi đang cố gắng học hỏi và cải thiện mỗi ngày."
      }
    ];
    
    // Kiểm tra các mẫu câu phản hồi thông thường
    for (const pattern of casualResponsePatterns) {
      if (pattern.pattern.test(prompt.trim())) {
        return pattern.response;
      }
    }
    
    // Kiểm tra xem nội dung có liên quan đến pháp luật không
    const legalKeywords = /lu[aậ]t|ph[aá]p|[dđ][iị]nh|[dđ][iê]̀u|kho[aả]n|ngh[iị]\s*[dđ][iị]nh|quy[eêề]n|ngh[iĩ]a\s*v[uụ]|h[iì]nh\s*s[uự]|d[aâ]n\s*s[uự]|h[aà]nh\s*ch[íi]nh|t[oố]\s*t[uụ]ng|th[uưủ]\s*t[uụ]c|doanh\s*nghi[eệ]p|kinh\s*doanh|lao\s*[dđ][oộ]ng|h[oô]n\s*nh[aâ]n|gia\s*[dđ][iì]nh|k[eế]t\s*h[oô]n|ly\s*h[oô]n|th[uừ]a\s*k[eế]|di\s*ch[uú]c|ch[uứ]ng\s*kho[áa]n/i;
    
    // Nếu không liên quan đến pháp luật, sử dụng chatbot thông thường
    if (!legalKeywords.test(prompt) && prompt.length < 80) {
      // Gọi API với system prompt là chatbot thông thường
      const response = await axios.post(OLLAMA_API_URL, {
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "Bạn là trợ lý AI đang trò chuyện với người dùng. Hãy trả lời ngắn gọn, tóm tắt, thân thiện, hài hước và bằng tiếng Việt. Không cần đề cập đến pháp luật nếu người dùng không hỏi. Nếu câu hỏi quá dài hoặc phức tạp, hãy nhẹ nhàng đề nghị người dùng chia nhỏ câu hỏi hoặc làm rõ hơn."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          stream: false
        }
      });
      
      if (response.data && response.data.message && response.data.message.content) {
        return response.data.message.content;
      }
    }
    
    // Chuẩn bị context từ các tài liệu
    let context = '';
    if (documents && documents.length > 0) {
      context = documents.map(doc => {
        let source = '';
        switch (doc.type) {
          case 'law':
            source = `Luật: ${doc.title}`;
            break;
          case 'faq':
            source = 'Câu hỏi thường gặp';
            break;
          case 'article':
            source = `Bài viết: ${doc.title}`;
            break;
          default:
            source = 'Tài liệu pháp lý';
        }
        return `--- ${source} ---\n${doc.content}\n`;
      }).join('\n');
    }

    // Chuẩn bị system message với context từ RAG
    const systemMessage = `Bạn là trợ lý AI tên là LegAI pháp luật chuyên về luật Việt Nam. Hãy trả lời câu hỏi dựa trên các tài liệu pháp lý được cung cấp dưới đây. 
Dữ liệu pháp lý:
${context}

Hãy trả lời rõ ràng, chính xác, tóm tắt bằng tiếng Việt, và dựa trên thông tin từ dữ liệu pháp lý đã cung cấp. 
Nếu bạn không tìm thấy thông tin cụ thể về vấn đề này trong dữ liệu, ĐỪNG TRẢ LỜI là "Tôi không tìm thấy thông tin cụ thể về vấn đề này trong bộ nhớ pháp luật của tôi". Thay vào đó, hãy giải thích chung, tóm tắt cực kì ngắn gọn về chủ đề đó dựa trên kiến thức pháp luật Việt Nam của bạn, đề cập đến nguyên tắc pháp luật liên quan, và đề xuất người dùng tìm hiểu thêm từ nguồn chính thức. Giới thiệu về lĩnh vực pháp luật liên quan, các luật chính điều chỉnh lĩnh vực đó hoặc các khái niệm cơ bản.
Hãy sáng tạo và hữu ích, đưa ra được giá trị cho người dùng thay vì từ chối trả lời.
Nếu bạn trích dẫn luật hoặc điều khoản cụ thể, hãy nêu rõ tên và số của luật/điều khoản đó.
KHÔNG BAO GIỜ được bịa đặt thông tin hoặc đưa ra ý kiến cá nhân. Chỉ trả lời dựa trên dữ liệu đã cung cấp và kiến thức pháp luật Việt Nam chung.`;

    // Chuẩn bị các tham số cho API
    const requestOptions = {
      temperature: options.temperature || 0.3, // Giá trị thấp để đảm bảo tính chính xác
      top_p: options.top_p || 0.95,
      top_k: options.top_k || 40,
      stream: false
    };

    // Chuẩn bị messages cho API
    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // Gọi API
    const response = await axios.post(OLLAMA_API_URL, {
      model: MODEL_NAME,
      messages: messages,
      stream: false,
      options: requestOptions
    });

    // Trích xuất kết quả
    if (response.data && response.data.message && response.data.message.content) {
      return response.data.message.content;
    } else {
      // Trả về thông báo thân thiện thay vì ném lỗi
      return "Tôi đang gặp khó khăn trong việc xử lý câu hỏi của bạn. Vui lòng thử lại sau hoặc kiểm tra lại câu hỏi của bạn.";
    }
  } catch (error) {
    console.error('Lỗi khi gọi Ollama API:', error.message);
    
    // Kiểm tra lỗi kết nối và trả về thông báo thân thiện
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return "Hiện tại, hệ thống trợ lý pháp luật đang tạm ngưng hoạt động. Vui lòng thử lại sau hoặc liên hệ với quản trị viên để được hỗ trợ.";
    }
    
    // Trả về thông báo chung cho các lỗi khác
    return "Tôi đang gặp khó khăn trong việc xử lý câu hỏi của bạn. Vui lòng thử lại sau hoặc kiểm tra lại câu hỏi của bạn.";
  }
};

/**
 * Kiểm tra kết nối đến Ollama API
 * @returns {Promise<boolean>} - true nếu kết nối thành công, false nếu không
 */
const checkConnection = async () => {
  try {
    // Gửi một yêu cầu đơn giản để kiểm tra kết nối
    const response = await axios.post(OLLAMA_API_URL, {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý AI."
        },
        {
          role: "user",
          content: "Xin chào"
        }
      ],
      stream: false
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Lỗi khi kiểm tra kết nối Ollama:', error.message);
    return false;
  }
};

module.exports = {
  generateResponse,
  checkConnection
}; 