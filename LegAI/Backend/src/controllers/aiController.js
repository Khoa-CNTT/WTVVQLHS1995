// src/controllers/aiController.js
const aiService = require('../services/aiService');
const aiModel = require('../models/aiModel');
const asyncHandler = require('../middleware/async');
const pool = require('../config/database');

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
    const isOllamaConnected = await require('../services/ollamaService').checkConnection();
    
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
  getMyAIChatHistory
}; 