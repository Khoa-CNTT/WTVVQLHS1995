// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/aiController');

// Option 1: Bỏ qua xác thực cho API ask (mặc định) - KHÔNG sử dụng cách này nữa
// router.post('/ask', answerQuestion);

// Option 2: Sử dụng middleware protect nếu có token, nhưng vẫn cho phép gọi API nếu không có token
const optionalProtect = (req, res, next) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    console.log('Token nhận được trong optionalProtect:', token ? `${token.substring(0, 10)}...` : 'không có');
    
    if (token) {
      // Nếu có token, sử dụng protect để xác thực và gán req.user
      return protect(req, res, next);
    } else {
      // Nếu không có token, vẫn cho phép truy cập nhưng không có req.user
      console.log('Không có token xác thực, cho phép truy cập ẩn danh');
      next();
    }
  } catch (error) {
    console.error('Lỗi trong optionalProtect middleware:', error);
    // Vẫn cho phép tiếp tục nếu có lỗi
    next();
  }
};

// Sử dụng middleware optionalProtect để hỗ trợ cả người dùng đã đăng nhập và chưa đăng nhập
router.post('/ask', optionalProtect, answerQuestion);

// Route để kiểm tra trạng thái AI - công khai
router.get('/status', checkStatus);

// Route để tải lại vector store - chỉ admin
router.post('/reload', protect, authorize('admin'), reloadVectorStore);

// Routes quản lý tư vấn AI - chỉ admin
router.get('/consultations', protect, authorize('admin'), getAIConsultations);
router.get('/consultations/:id', protect, authorize('admin'), getAIConsultationById);
router.post('/consultations', protect, authorize('admin'), createAIConsultation);
router.put('/consultations/:id', protect, authorize('admin'), updateAIConsultation);
router.delete('/consultations/:id', protect, authorize('admin'), deleteAIConsultation);

// Routes lịch sử chat AI
router.get('/chat-history/:userId', protect, getUserChatHistory);
router.get('/my-chat-history', protect, getMyAIChatHistory);

module.exports = router; 