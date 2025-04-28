// src/controllers/aiController.js
const aiService = require('../services/aiService');
const asyncHandler = require('../middleware/async');

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
    
    // Gửi câu hỏi đến AI Service
    const result = await aiService.answerLegalQuestion(question, modelOptions);
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      data: result
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

module.exports = {
  answerQuestion,
  reloadVectorStore,
  checkStatus
}; 