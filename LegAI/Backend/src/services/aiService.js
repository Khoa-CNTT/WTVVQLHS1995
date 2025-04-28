const ragService = require('./ragService');
const ollamaService = require('./ollamaService');

/**
 * Khởi tạo các service cần thiết
 * @returns {Promise<void>}
 */
const initialize = async () => {
  try {
    console.log('Khởi tạo AI Service...');
    
    // Kiểm tra kết nối Ollama
    const isOllamaConnected = await ollamaService.checkConnection();
    if (!isOllamaConnected) {
      console.error('Không thể kết nối đến Ollama. Vui lòng kiểm tra xem Ollama đã được khởi động chưa?');
    } else {
      console.log('Kết nối Ollama thành công');
    }
    
    // Tải dữ liệu pháp luật
    await ragService.loadLegalData();
    
    // Khởi tạo vector store (có thể mất nhiều thời gian)
    console.log('Bắt đầu khởi tạo vector store (quá trình này có thể mất vài phút)...');
    await ragService.createVectorStore();
    
    console.log('Khởi tạo AI Service thành công');
  } catch (error) {
    console.error('Lỗi khi khởi tạo AI Service:', error);
    throw error;
  }
};

/**
 * Trả lời câu hỏi pháp lý dựa trên RAG
 * @param {string} question - Câu hỏi của người dùng
 * @param {Object} options - Các tùy chọn (temperature, top_k, ...)
 * @returns {Promise<Object>} - Kết quả trả về bao gồm câu trả lời và tài liệu liên quan
 */
const answerLegalQuestion = async (question, options = {}) => {
  try {
    // Đảm bảo câu hỏi không rỗng
    if (!question || question.trim() === '') {
      return {
        answer: 'Câu hỏi không được để trống. Vui lòng đặt câu hỏi cụ thể về pháp luật.',
        documents: []
      };
    }
        
    // Xử lý các câu hỏi về tư vấn pháp lý
    const legalAdviceQuestions = [
      /tư\s*vấn\s*pháp\s*l(ý|uật)/i,
      /tư\s*vấn\s*luật/i,
      /(tư\s*vấn|hướng\s*dẫn)\s*(về)?\s*(vấn\s*đề)?\s*pháp\s*l(ý|uật)/i,
      /dịch\s*vụ\s*tư\s*vấn\s*pháp\s*l(ý|uật)/i,
      /tư\s*vấn\s*(về)?\s*(vấn\s*đề)?\s*pháp\s*l(ý|uật)/i
    ];
    
    // Nếu là câu hỏi về tư vấn pháp lý
    if (legalAdviceQuestions.some(pattern => pattern.test(question.trim()))) {
      return {
        answer: "Tôi là trợ lý AI pháp luật của LegAI, có thể tư vấn cho bạn về các vấn đề pháp lý sau:\n\n1. **Tư vấn pháp luật dân sự**: Hợp đồng, quyền sở hữu tài sản, thừa kế, bồi thường thiệt hại...\n\n2. **Tư vấn pháp luật hôn nhân gia đình**: Đăng ký kết hôn, ly hôn, quyền nuôi con, cấp dưỡng, chia tài sản chung...\n\n3. **Tư vấn pháp luật doanh nghiệp**: Thành lập doanh nghiệp, quản trị công ty, giải thể, phá sản...\n\n4. **Tư vấn pháp luật lao động**: Hợp đồng lao động, bảo hiểm xã hội, tranh chấp lao động...\n\n5. **Tư vấn pháp luật đất đai**: Quyền sử dụng đất, thủ tục chuyển nhượng, tranh chấp đất đai...\n\nTôi cung cấp thông tin pháp luật chung, giải thích các quy định pháp luật, và hướng dẫn các thủ tục pháp lý. Xin lưu ý rằng thông tin này mang tính tham khảo và không thay thế cho tư vấn chính thức từ luật sư. Với các vấn đề phức tạp hoặc cần đại diện pháp lý, bạn nên tham khảo ý kiến luật sư.\n\nBạn cần tư vấn về vấn đề pháp lý cụ thể nào?",
        documents: []
      };
    }
    
    // Xử lý các câu hỏi chung về luật
    const genericLegalQuestions = [
      /^(về)?\s*luật\s*$/i,
      /^(về)?\s*pháp\s*luật\s*$/i,
      /^(về)?\s*luật\s*(pháp)?\s*$/i,
      /^luật\s*mà$/i,
      /^pháp\s*luật\s*mà$/i,
      /hỏi\s*(về)?\s*luật/i,
      /nói\s*(về)?\s*luật/i,
      /thế\s*(hỏi|nói)\s*(về)?\s*luật/i,
      /luật\s*(là\s*(gì|sao))?$/i,
      /pháp\s*luật\s*(là\s*(gì|sao))?$/i
    ];
    
    // Nếu là câu hỏi chung về luật
    if (genericLegalQuestions.some(pattern => pattern.test(question.trim()))) {
      return {
        answer: "Tôi có thể tư vấn về nhiều lĩnh vực pháp luật Việt Nam. Hiện tại tôi có thông tin về:\n\n1. Luật Hôn nhân và Gia đình 2014 (điều kiện kết hôn, thủ tục đăng ký kết hôn, ly hôn)\n2. Luật Doanh nghiệp 2020 (thành lập, tổ chức quản lý doanh nghiệp)\n3. Bộ luật Dân sự 2015 (quyền sở hữu, thừa kế, hợp đồng)\n4. Các quy định về lao động theo Bộ luật Lao động 2019\n5. Thủ tục đăng ký kinh doanh\n6. Thủ tục khởi kiện dân sự\n\nBạn quan tâm đến lĩnh vực nào? Hoặc bạn có thể hỏi cụ thể về vấn đề pháp lý bạn đang gặp phải.",
        documents: []
      };
    }

    // Kiểm tra câu hỏi mở đầu hoặc yêu cầu hỏi
    const promptingQuestions = [
      /^thế\s*(hỏi|nói)\s*(gì|j)\s*(đi|đây|nào)/i,
      /^(hỏi|nói)\s*(gì|j)\s*(đi|đây|nào)/i,
      /^(hỏi|nói)\s*(cái\s*gì|cái\s*j)\s*(đi|đây|nào)/i,
      /^(giới\s*thiệu|kể)\s*(gì|j)\s*(đi|đây|nào)/i,
      /muốn\s*biết\s*(gì|j)/i,
      /biết\s*(gì|j)/i
    ];
    
    // Nếu là câu hỏi mở đầu hoặc yêu cầu hỏi
    if (promptingQuestions.some(pattern => pattern.test(question.trim()))) {
      return {
        answer: "Tôi là trợ lý AI pháp luật, tôi có thể giúp bạn giải đáp các thắc mắc về pháp luật Việt Nam như Luật Hôn nhân và Gia đình, Luật Doanh nghiệp, Bộ luật Dân sự, và nhiều lĩnh vực khác. Bạn có thể hỏi tôi về các vấn đề như đăng ký kết hôn, thành lập doanh nghiệp, quyền thừa kế, hợp đồng, quan hệ lao động, hoặc các thủ tục pháp lý. Bạn cần tư vấn về vấn đề nào?",
        documents: []
      };
    }
    
    // Kiểm tra câu hỏi về tên luật sư cụ thể
    const specificLawyerQuestions = [
      /biết\s*(luật\s*sư|ls)\s*nào/i,
      /tên\s*(luật\s*sư|ls)/i,
      /(luật\s*sư|ls)\s*[oơở]\s*đây/i,
      /(luật\s*sư|ls)\s*nào\s*(giỏi|tốt)/i,
      /^(luật\s*sư|ls)\s*ở\s*/i,
      /giới\s*thiệu\s*(luật\s*sư|ls)/i,
      /có\s*(luật\s*sư|ls)\s*không/i
    ];
    
    // Nếu là câu hỏi về tên luật sư cụ thể
    if (specificLawyerQuestions.some(pattern => pattern.test(question.trim()))) {
      return {
        answer: "Tôi là trợ lý AI tư vấn pháp luật và không phải là luật sư. Tôi cũng không có thông tin cụ thể về các luật sư cá nhân, công ty luật hay văn phòng luật. Nếu bạn cần tìm luật sư, bạn có thể liên hệ với Luật sư ở LegAI trên thanh cuộn. Tuy nhiên, tôi có thể giúp giải đáp các câu hỏi chung về pháp luật nếu bạn cần.",
        documents: []
      };
    }
    
    // Kiểm tra câu hỏi về thông tin chung về luật sư
    const generalLawyerQuestions = [
      /luật\s*sư/i,
      /^(về)?\s*nghề\s*luật\s*$/i,
      /^(về)?\s*nghề\s*luật\s*sư\s*$/i
    ];
    
    // Nếu là câu hỏi về thông tin chung về luật sư
    if (generalLawyerQuestions.some(pattern => pattern.test(question.trim())) &&
        !specificLawyerQuestions.some(pattern => pattern.test(question.trim()))) {
      return {
        answer: "Luật sư là người hành nghề luật, được đào tạo chuyên môn về pháp luật và được cấp phép hành nghề. Tại Việt Nam, để trở thành luật sư, một người phải có bằng cử nhân luật, hoàn thành khóa đào tạo nghề luật sư, tham gia kỳ thi cấp chứng chỉ hành nghề luật sư và được cấp thẻ luật sư.\n\nLuật sư có thể tư vấn pháp luật, soạn thảo hợp đồng, đại diện cho khách hàng trong các vụ việc dân sự, hình sự, hành chính và các lĩnh vực pháp lý khác. Tôi không phải là luật sư và thông tin tôi cung cấp chỉ mang tính tham khảo, không thay thế cho tư vấn pháp lý chuyên nghiệp từ một luật sư được cấp phép.",
        documents: []
      };
    }
    
    // Kiểm tra xem nội dung có liên quan đến pháp luật không
    const legalKeywords = /lu[aậ]t|ph[aá]p|[dđ][iị]nh|[dđ][iê]̀u|kho[aả]n|ngh[iị]\s*[dđ][iị]nh|quy[eêề]n|ngh[iĩ]a\s*v[uụ]|h[iì]nh\s*s[uự]|d[aâ]n\s*s[uự]|h[aà]nh\s*ch[íi]nh|t[oố]\s*t[uụ]ng|th[uưủ]\s*t[uụ]c|doanh\s*nghi[eệ]p|kinh\s*doanh|lao\s*[dđ][oộ]ng|h[oô]n\s*nh[aâ]n|gia\s*[dđ][iì]nh|k[eế]t\s*h[oô]n|ly\s*h[oô]n|th[uừ]a\s*k[eế]|di\s*ch[uú]c|ch[uứ]ng\s*kho[áa]n/i;
    
    // Truy vấn các tài liệu liên quan nếu câu hỏi liên quan đến pháp luật hoặc đủ dài
    if (legalKeywords.test(question) || question.length > 80) {
      console.log('Tìm kiếm tài liệu liên quan...');
      let relevantDocs = [];
      
      try {
        relevantDocs = await ragService.query(question, options.topK || 5);
      } catch (error) {
        console.error('Lỗi khi tìm kiếm tài liệu:', error);
        return {
          answer: 'Đã xảy ra lỗi khi tìm kiếm tài liệu pháp luật. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
          documents: []
        };
      }
      
      if (relevantDocs && relevantDocs.length > 0) {
        console.log(`Tìm thấy ${relevantDocs.length} tài liệu liên quan`);
        
        // Lấy câu trả lời từ LLM dựa trên tài liệu tìm được
        console.log('Tạo câu trả lời từ LLM...');
        let answer;
        
        try {
          answer = await ollamaService.generateResponse(question, relevantDocs, options);
        } catch (error) {
          console.error('Lỗi khi tạo câu trả lời:', error);
          return {
            answer: 'Đang gặp sự cố khi kết nối với dịch vụ trợ lý ảo. Vui lòng thử lại sau.',
            documents: []
          };
        }
        
        // Chuẩn bị thông tin về tài liệu để trả về (không bao gồm nội dung đầy đủ)
        const documentInfo = relevantDocs.map(doc => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          originalId: doc.originalId
        }));
        
        return {
          answer,
          documents: documentInfo
        };
      }
    }
    
    // Nếu không tìm thấy tài liệu liên quan hoặc câu hỏi không liên quan đến pháp luật
    // Sử dụng ollamaService để tạo câu trả lời tự nhiên
    try {
      const answer = await ollamaService.generateResponse(question, [], {
        ...options,
        conversational: true // Đánh dấu đây là cuộc trò chuyện thông thường
      });
      
      return {
        answer,
        documents: []
      };
    } catch (error) {
      console.error('Lỗi khi tạo câu trả lời:', error);
      return {
        answer: 'Đang gặp sự cố khi kết nối với dịch vụ trợ lý ảo. Vui lòng thử lại sau.',
        documents: []
      };
    }
  } catch (error) {
    console.error('Lỗi khi trả lời câu hỏi:', error);
    return {
      answer: 'Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
      documents: []
    };
  }
};

/**
 * Khởi động lại vector store (sử dụng khi cập nhật dữ liệu)
 * @returns {Promise<void>}
 */
const reloadVectorStore = async () => {
  try {
    console.log('Bắt đầu tải lại vector store...');
    
    // Reset biến lưu trữ trong ragService
    await ragService.createVectorStore();
    
    console.log('Đã tải lại vector store thành công');
  } catch (error) {
    console.error('Lỗi khi tải lại vector store:', error);
    throw error;
  }
};

module.exports = {
  initialize,
  answerLegalQuestion,
  reloadVectorStore
}; 