const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// Routes công khai
router.post('/webhook', transactionController.paymentWebhook);

// Routes yêu cầu xác thực
router.use(protect);

// Tạo giao dịch mới
router.post('/', transactionController.createTransaction);

// Lấy chi tiết giao dịch
router.get('/:id', transactionController.getTransactionById);

// Routes dành cho luật sư
router.get('/lawyer', authorize('lawyer'), transactionController.getLawyerTransactions);
router.get('/lawyer/stats', authorize('lawyer'), transactionController.getLawyerFinancialStats);
router.post('/:id/confirm', authorize('lawyer'), transactionController.confirmPayment);

// Cập nhật trạng thái giao dịch
router.patch('/:id/status', protect, transactionController.updateTransactionStatus);

module.exports = router; 