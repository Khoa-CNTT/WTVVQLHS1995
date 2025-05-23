const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const pool = require('../config/database');

// Routes công khai
router.post('/webhook', transactionController.paymentWebhook);

// Routes yêu cầu xác thực
router.use(protect);

// Tạo giao dịch mới
router.post('/', transactionController.createTransaction);

// Route để lấy tất cả giao dịch (chỉ dành cho admin)
router.get('/all', authorize('admin'), transactionController.getAllTransactions);

// Routes dành cho luật sư
router.get('/lawyer', authorize('lawyer'), transactionController.getLawyerTransactions);
router.get('/lawyer/stats', authorize('lawyer'), transactionController.getLawyerFinancialStats);

// Thêm route để lấy danh sách giao dịch theo case_id
router.get('/case/:caseId', protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Kiểm tra case_id
    if (!caseId || isNaN(parseInt(caseId))) {
      return res.status(400).json({
        success: false,
        message: 'ID vụ án không hợp lệ'
      });
    }
    
    // Lấy thông tin người dùng từ request
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    
    // Xác định điều kiện truy vấn
    let queryCondition = { case_id: caseId };
    
    // Nếu người dùng không phải là admin hay luật sư, chỉ lấy giao dịch của họ
    if (userRole !== 'admin' && userRole !== 'lawyer' && userRole !== 'luật sư') {
      queryCondition.user_id = userId;
    }
    
    // Nếu là luật sư, kiểm tra xem họ có phải là luật sư được gán cho vụ án không
    if (userRole === 'lawyer' || userRole === 'luật sư') {
      // Kiểm tra trong DB xem luật sư này có phải được gán cho vụ án này không
      const caseCheck = await pool.query(
        'SELECT * FROM LegalCases WHERE id = $1 AND lawyer_id = $2', 
        [caseId, userId]
      );
      
      // Nếu không phải luật sư của vụ án này
      if (caseCheck.rows.length === 0) {
        queryCondition.lawyer_id = userId; // Chỉ lấy giao dịch của luật sư này
      }
    }
    
    // Truy vấn database
    const query = {
      text: `SELECT * FROM Transactions WHERE case_id = $1 ORDER BY created_at DESC`,
      values: [caseId]
    };
    
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      message: 'Lấy danh sách giao dịch theo vụ án thành công',
      data: result.rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch theo vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giao dịch theo vụ án'
    });
  }
});

// ---- Routes quản lý phí pháp lý (FeeReferences) ----

// Lấy danh sách phí pháp lý - KHÔNG CẦN XÁC THỰC
router.get('/fee-references', transactionController.getFeeReferences);

// Tạo mới phí pháp lý (chỉ admin)
router.post('/fee-references', protect, authorize('admin'), transactionController.createFeeReference);

// Cập nhật phí pháp lý (chỉ admin)
router.put('/fee-references/:id', protect, authorize('admin'), transactionController.updateFeeReference);

// Xóa phí pháp lý (chỉ admin)
router.delete('/fee-references/:id', protect, authorize('admin'), transactionController.deleteFeeReference);

// Các routes cho giao dịch cụ thể - ĐẶT PHÍA SAU các routes khác để tránh xung đột

// Xác nhận thanh toán (chỉ luật sư)
router.patch('/:id/confirm', authorize('lawyer'), transactionController.confirmPayment);

// Lấy chi tiết giao dịch
router.get('/:id', transactionController.getTransactionById);

// Cập nhật trạng thái giao dịch
router.patch('/:id/status', protect, transactionController.updateTransactionStatus);

module.exports = router; 