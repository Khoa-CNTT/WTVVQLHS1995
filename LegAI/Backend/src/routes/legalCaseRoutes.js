const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const legalCaseController = require('../controllers/legalCaseController');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/legal-cases/');
  },
  filename: function (req, file, cb) {
    const userId = req.user.id;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    cb(null, `case_${userId}_${timestamp}${fileExt}`);
  }
});

// Lọc file: chỉ chấp nhận PDF, DOCX, TXT
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF, DOCX, TXT'), false);
  }
};

// Cấu hình upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  }
});

// Cấu hình multer cho việc tải lên file để trích xuất nội dung
const extractFileUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../uploads/temp'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, DOC, DOCX hoặc TXT'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

// Tạo vụ án mới (có thể kèm file hoặc tạo bằng AI)
router.post('/', protect, upload.single('file'), legalCaseController.createLegalCase);

// Lấy danh sách vụ án của người dùng hiện tại
router.get('/', protect, legalCaseController.getLegalCases);

// Lấy danh sách vụ án của luật sư hiện tại
router.get('/lawyer-cases', protect, authorize('lawyer', 'admin'), legalCaseController.getLawyerCases);

// Route để lấy tất cả vụ án (chỉ dành cho admin)
router.get('/all', protect, authorize('admin'), legalCaseController.getAllLegalCases);

// Lấy loại vụ án
router.get('/case-types', legalCaseController.getCaseTypes);

// Lấy chi tiết vụ án theo ID
router.get('/:id', protect, legalCaseController.getLegalCaseById);

// Cập nhật thông tin vụ án
router.put('/:id', protect, upload.single('file'), legalCaseController.updateLegalCase);

// Xóa vụ án
router.delete('/:id', protect, legalCaseController.deleteLegalCase);

// Gửi yêu cầu tạo bản nháp bằng AI
router.post('/ai-draft', protect, legalCaseController.createAIDraft);

// Gán vụ án cho luật sư
router.post('/:id/assign-lawyer', protect, legalCaseController.assignLawyer);

// Tính phí vụ án
router.post('/:id/calculate-fee', protect, legalCaseController.calculateFee);

// Tạo giao dịch thanh toán
router.post('/:id/payment', protect, legalCaseController.createPayment);

// Xác nhận thanh toán (webhook từ cổng thanh toán)
router.post('/payment-webhook', legalCaseController.paymentWebhook);

// Tải xuống tài liệu vụ án
router.get('/:id/download', protect, legalCaseController.downloadDocument);

// Cập nhật trạng thái vụ án
router.patch('/:id/status', protect, authorize('lawyer', 'admin'), legalCaseController.updateCaseStatus);

// Route để kiểm tra trạng thái thanh toán của vụ án
router.get('/:id/payment-status', protect, legalCaseController.getPaymentStatus);

// Route để trích xuất nội dung từ file
router.post(
  '/extract-content',
  protect,
  extractFileUpload.single('file'),
  legalCaseController.extractFileContent
);

module.exports = router; 