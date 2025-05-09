// src/controllers/aiController.js
const aiService = require('../services/aiService');
const aiModel = require('../models/aiModel');
const asyncHandler = require('../middleware/async');
const pool = require('../config/database');
const ollamaService = require('../services/ollamaService');

/**
 * @desc    Trả lời câu hỏi pháp lý
 * @route   POST /api/ai/ask
 * @access  Public
 */
const answerQuestion = asyncHandler(async (req, res) => {
  try {
    const { question, options } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp câu hỏi'
      });
    }
    
    // Thiết lập các tùy chọn mặc định nếu không được cung cấp
    const modelOptions = {
      temperature: options?.temperature || 0.3,
      top_p: options?.top_p || 0.95,
      top_k: options?.top_k || 40,
      topK: options?.topK || 5 // Số lượng tài liệu liên quan
    };
    
    // Log thông tin user nếu có
    if (req.user) {
      console.log('Request từ user đã xác thực:', {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      });
    } else {
      console.log('Request từ người dùng không xác thực (anonymous)');
    }
    
    // Gửi câu hỏi đến AI Service
    const result = await aiService.answerLegalQuestion(question, modelOptions);
    
    // Lấy user_id từ token xác thực nếu có
    const userId = req.user?.id || null;
    
    // Sử dụng model để lưu vào database
    const dbResult = await aiModel.saveAIConsultation(userId, question, result.answer);
    
    console.log('Kết quả lưu vào database:', dbResult);
    
    // Trả về kết quả kèm theo thông tin lưu vào database
    return res.status(200).json({
      success: true,
      data: result,
      saved_to_db: dbResult.success,
      db_record_id: dbResult.success ? dbResult.record.id : null,
      db_error: dbResult.error || null
    });
  } catch (error) {
    console.error('Lỗi khi xử lý câu hỏi:', error);
    
    // Kiểm tra lỗi kết nối Ollama
    if (error.message && error.message.includes('Không thể kết nối đến Ollama')) {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ AI đang không khả dụng. Vui lòng thử lại sau.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xử lý câu hỏi'
    });
  }
});

/**
 * @desc    Khởi động lại vector store
 * @route   POST /api/ai/reload
 * @access  Private/Admin
 */
const reloadVectorStore = asyncHandler(async (req, res) => {
  try {
    await aiService.reloadVectorStore();
    
    return res.status(200).json({
      success: true,
      message: 'Đã tải lại vector store thành công'
    });
  } catch (error) {
    console.error('Lỗi khi tải lại vector store:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tải lại vector store'
    });
  }
});

/**
 * @desc    Kiểm tra trạng thái của AI Service
 * @route   GET /api/ai/status
 * @access  Public
 */
const checkStatus = asyncHandler(async (req, res) => {
  try {
    // Kiểm tra kết nối Ollama
    const isOllamaConnected = await ollamaService.checkConnection();
    
    return res.status(200).json({
      success: true,
      data: {
        ollamaConnected: isOllamaConnected,
        modelName: "qwen2.5:3b",
        vectorStoreReady: true // Giả định vector store đã sẵn sàng nếu controller có thể trả về
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái AI:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi kiểm tra trạng thái AI'
    });
  }
});

/**
 * @desc    Lấy danh sách tư vấn AI
 * @route   GET /api/ai/consultations
 * @access  Private/Admin
 */
const getAIConsultations = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const userId = req.query.userId || null;
    
    // Sử dụng model để lấy danh sách
    const result = await aiModel.getAllAIConsultations({
      search, 
      userId, 
      page, 
      limit
    });
    
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tư vấn AI:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách tư vấn AI'
    });
  }
});

/**
 * @desc    Lấy chi tiết tư vấn AI
 * @route   GET /api/ai/consultations/:id
 * @access  Private/Admin
 */
const getAIConsultationById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT a.*, u.username as user_name, u.email as user_email 
      FROM AIConsultations a
      LEFT JOIN Users u ON a.user_id = u.id
      WHERE a.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tư vấn AI'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết tư vấn AI:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết tư vấn AI'
    });
  }
});

/**
 * @desc    Tạo tư vấn AI mới
 * @route   POST /api/ai/consultations
 * @access  Private/Admin
 */
const createAIConsultation = asyncHandler(async (req, res) => {
  try {
    const { userId, question, answer } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ câu hỏi và câu trả lời'
      });
    }
    
    // Nếu không có userId, sử dụng ID của người dùng hiện tại
    const userIdToUse = userId || req.user.id;
    
    // Kiểm tra xem userId có tồn tại không
    const userCheck = await pool.query('SELECT id FROM Users WHERE id = $1', [userIdToUse]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không tồn tại'
      });
    }
    
    const query = `
      INSERT INTO AIConsultations (user_id, question, answer, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [userIdToUse, question, answer]);
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tạo tư vấn AI mới thành công'
    });
  } catch (error) {
    console.error('Lỗi khi tạo tư vấn AI mới:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo tư vấn AI mới'
    });
  }
});

/**
 * @desc    Cập nhật tư vấn AI
 * @route   PUT /api/ai/consultations/:id
 * @access  Private/Admin
 */
const updateAIConsultation = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ câu hỏi và câu trả lời'
      });
    }
    
    // Kiểm tra xem tư vấn AI có tồn tại không
    const checkQuery = 'SELECT id FROM AIConsultations WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tư vấn AI'
      });
    }
    
    const query = `
      UPDATE AIConsultations
      SET question = $1, answer = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [question, answer, id]);
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Cập nhật tư vấn AI thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật tư vấn AI:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật tư vấn AI'
    });
  }
});

/**
 * @desc    Xóa tư vấn AI
 * @route   DELETE /api/ai/consultations/:id
 * @access  Private/Admin
 */
const deleteAIConsultation = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem tư vấn AI có tồn tại không
    const checkQuery = 'SELECT id FROM AIConsultations WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tư vấn AI'
      });
    }
    
    const query = 'DELETE FROM AIConsultations WHERE id = $1';
    await pool.query(query, [id]);
    
    return res.status(200).json({
      success: true,
      message: 'Xóa tư vấn AI thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa tư vấn AI:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa tư vấn AI'
    });
  }
});

/**
 * @desc    Lấy lịch sử chat AI của người dùng hiện tại
 * @route   GET /api/ai/my-chat-history
 * @access  Private
 */
const getMyAIChatHistory = asyncHandler(async (req, res) => {
  try {
    // Nếu không có user ID trong token, trả về lỗi
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem lịch sử chat'
      });
    }

    // Sử dụng model để lấy lịch sử chat
    const chatHistory = await aiModel.getAIChatHistoryByUser(req.user.id, 100);
    
    return res.status(200).json({
      success: true,
      data: chatHistory,
      count: chatHistory.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch sử chat'
    });
  }
});

/**
 * @desc    Lấy lịch sử chat AI theo user_id
 * @route   GET /api/ai/chat-history/:userId
 * @access  Private
 */
const getUserChatHistory = asyncHandler(async (req, res) => {
  try {
    // Lấy user_id từ params
    const { userId } = req.params;
    
    // Lấy user_id từ token để kiểm tra
    const authenticatedUserId = req.user?.id;
    
    // Kiểm tra nếu không phải là admin và không phải đang lấy lịch sử của chính mình
    if (req.user?.role?.toLowerCase() !== 'admin' && authenticatedUserId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập lịch sử chat của người dùng khác'
      });
    }

    // Sử dụng model để lấy lịch sử chat
    const chatHistory = await aiModel.getAIChatHistoryByUser(userId, 100);
    
    return res.status(200).json({
      success: true,
      data: chatHistory,
      count: chatHistory.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch sử chat'
    });
  }
});

/**
 * @desc    Phân tích văn bản pháp luật
 * @route   POST /api/ai/analyze-legal/:id
 * @access  Public
 */
const analyzeLegalDocument = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID văn bản pháp luật'
      });
    }
    
    console.log(`Bắt đầu phân tích văn bản pháp luật ID: ${id}`);
    
    // Lấy thông tin và nội dung văn bản
    const documentQuery = `
      SELECT 
        id, 
        title, 
        document_type, 
        version, 
        content,
        summary,
        issued_date,
        created_at,
        language
      FROM LegalDocuments 
      WHERE id = $1
    `;
    
    const documentResult = await pool.query(documentQuery, [id]);
    
    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy văn bản pháp luật'
      });
    }
    
    const document = documentResult.rows[0];
    const { title, document_type, content, summary, issued_date } = document;
    
    // Tạo prompt phân tích văn bản pháp luật
    let prompt = `
    Bạn là trợ lý AI pháp lý chuyên phân tích văn bản pháp luật Việt Nam. Hãy phân tích chi tiết văn bản pháp luật sau và trả về kết quả dưới dạng JSON có cấu trúc cụ thể.
    
    THÔNG TIN VĂN BẢN:
    - Tiêu đề: ${title}
    - Loại văn bản: ${document_type}
    - Ngày ban hành: ${issued_date ? new Date(issued_date).toLocaleDateString('vi-VN') : 'Không rõ'}
    
    NỘI DUNG VĂN BẢN:
    ${content.substring(0, 12000)} ${content.length > 12000 ? '... (nội dung đã được cắt ngắn)' : ''}
    
    TÓM TẮT HIỆN CÓ:
    ${summary || 'Không có tóm tắt'}
    
    YÊU CẦU PHÂN TÍCH:
    1. Tạo một tóm tắt ngắn gọn, súc tích về văn bản (2-3 câu).
    2. Xác định 5-7 điểm chính của văn bản.
    3. Phân tích chi tiết về các khía cạnh pháp lý quan trọng (bao gồm phạm vi áp dụng, đối tượng điều chỉnh, quyền và nghĩa vụ, các điều khoản đáng chú ý).
    4. Xác định các lĩnh vực pháp luật liên quan.
    5. Đưa ra đề xuất và nhận xét về cách hiểu và áp dụng văn bản này.
    6. Nêu các vấn đề tiềm ẩn hoặc điểm chưa rõ ràng (nếu có).
    
    Trả về phân tích dưới dạng JSON theo cấu trúc sau: 
    {
      "summary": "tóm tắt ngắn gọn", 
      "key_points": ["điểm 1", "điểm 2", ...], 
      "legal_analysis": "phân tích chi tiết", 
      "related_fields": ["lĩnh vực 1", "lĩnh vực 2", ...], 
      "recommendations": "các đề xuất", 
      "potential_issues": "vấn đề tiềm ẩn"
    }
    
    Chỉ trả về JSON, không thêm bất kỳ giải thích nào khác.
    `;
    
    // Gọi ollamaService để lấy phân tích từ mô hình AI
    console.log('Đang gửi yêu cầu đến mô hình AI...');
    const responseData = await ollamaService.generateResponse(prompt);
    
    console.log('Đã nhận phản hồi từ mô hình AI');
    
    let analysisResult;
    try {
      // Tìm và trích xuất JSON từ phản hồi của AI
      const jsonMatch = responseData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Không thể tìm thấy định dạng JSON trong phản hồi');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích phản hồi AI:', error.message);
      
      // Nếu không thể parse JSON, tạo một phiên bản dự phòng có cấu trúc
      analysisResult = {
        summary: "Không thể tạo tóm tắt tự động cho văn bản này",
        key_points: content ? extractKeyPoints(content) : ["Không thể xác định các điểm chính"],
        legal_analysis: "Quá trình phân tích tự động gặp sự cố. Vui lòng đọc trực tiếp văn bản để có thông tin chính xác nhất.",
        related_fields: document_type ? [document_type] : ["Pháp luật"],
        recommendations: "Vui lòng tham khảo ý kiến chuyên gia pháp lý để hiểu đúng văn bản này.",
        potential_issues: "Không thể xác định các vấn đề tiềm ẩn"
      };
    }
    
    // Trả về kết quả phân tích
    return res.status(200).json({
      success: true,
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Lỗi khi phân tích văn bản pháp luật:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi phân tích văn bản pháp luật: ${error.message}`,
      data: {
        summary: "Đã xảy ra lỗi khi phân tích văn bản pháp luật này",
        key_points: ["Hệ thống gặp sự cố khi phân tích", "Vui lòng thử lại sau"],
        legal_analysis: "Không thể thực hiện phân tích pháp lý do lỗi hệ thống",
        related_fields: ["Pháp luật"],
        recommendations: "Vui lòng thử lại sau hoặc đọc trực tiếp văn bản",
        potential_issues: "Không có thông tin"
      }
    });
  }
});

/**
 * Hàm trích xuất các điểm chính từ nội dung văn bản khi AI không thể phân tích
 * @param {string} content - Nội dung văn bản pháp luật
 * @returns {string[]} - Mảng các điểm chính
 */
function extractKeyPoints(content) {
  // Tìm các tiêu đề hoặc điều khoản trong văn bản
  const keyPoints = [];
  
  // Tìm các điều khoản (Điều X)
  const articleRegex = /Điều\s+\d+[.:]\s*([^.!?]*[.!?])/gi;
  let articleMatch;
  
  // Giới hạn số điểm chính
  let count = 0;
  
  while ((articleMatch = articleRegex.exec(content)) !== null && count < 5) {
    if (articleMatch[1] && articleMatch[1].trim().length > 10) {
      keyPoints.push(articleMatch[0].trim());
      count++;
    }
  }
  
  // Nếu không tìm thấy đủ điều khoản, thêm các đoạn văn đầu tiên
  if (keyPoints.length < 3) {
    const paragraphs = content.split(/\n+/);
    for (const para of paragraphs) {
      if (para.trim().length > 30 && keyPoints.length < 5) {
        // Chỉ lấy các đoạn văn có ý nghĩa (đủ dài)
        const trimmedPara = para.trim();
        if (!keyPoints.includes(trimmedPara)) {
          keyPoints.push(trimmedPara);
        }
      }
    }
  }
  
  // Nếu vẫn không đủ, thêm thông báo
  if (keyPoints.length === 0) {
    keyPoints.push("Không thể tự động xác định các điểm chính");
    keyPoints.push("Vui lòng đọc toàn bộ văn bản để nắm thông tin chính xác");
  }
  
  return keyPoints;
}

module.exports = {
  answerQuestion,
  reloadVectorStore,
  checkStatus,
  getAIConsultations,
  getAIConsultationById,
  createAIConsultation,
  updateAIConsultation,
  deleteAIConsultation,
  getUserChatHistory,
  getMyAIChatHistory,
  analyzeLegalDocument
}; 