const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getChatHistory,
  executeAction,
  startConversation,
  setConversationContext
} = require('../controllers/chatbotController');

// Route công khai: Gửi tin nhắn đến chatbot (công khai, nhưng yêu cầu xác thực để có nhiều chức năng hơn)
router.post('/message', sendMessage);

// Route công khai: Khởi tạo cuộc trò chuyện mới
router.post('/start', startConversation);

// Route công khai: Đặt ngữ cảnh cho cuộc trò chuyện
router.post('/context', setConversationContext);

// Routes yêu cầu xác thực: Lấy lịch sử trò chuyện
router.get('/history/:senderId', protect, getChatHistory);

// Routes yêu cầu xác thực: Thực hiện hành động
router.post('/action', protect, executeAction);

module.exports = router; 