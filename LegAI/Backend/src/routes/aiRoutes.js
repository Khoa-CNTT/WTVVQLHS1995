// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  answerQuestion,
  reloadVectorStore,
  checkStatus
} = require('../controllers/aiController');

// Route để trả lời câu hỏi pháp lý - công khai
router.post('/ask', answerQuestion);

// Route để kiểm tra trạng thái AI - công khai
router.get('/status', checkStatus);

// Route để tải lại vector store - chỉ admin mới có quyền
router.post('/reload', protect, authorize('admin'), reloadVectorStore);

module.exports = router; 