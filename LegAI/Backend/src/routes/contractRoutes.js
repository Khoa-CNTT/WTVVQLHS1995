const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  downloadContract
} = require('../controllers/contractController');
const multer = require('multer');
const path = require('path');

// Cấu hình multer để lưu file hợp đồng
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/contracts/');
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất theo user_id, timestamp và giữ nguyên extension
    const userId = req.user.id;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${fileExt}`);
  }
});

// Lọc file, chỉ chấp nhận PDF và DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF, DOC hoặc DOCX'), false);
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

// Lấy danh sách hợp đồng của người dùng hiện tại
router.get('/', protect, getContracts);

// Lấy chi tiết hợp đồng theo ID
router.get('/:id', protect, getContractById);

// Tạo hợp đồng mới
router.post('/', protect, upload.single('file'), createContract);

// Cập nhật hợp đồng
router.put('/:id', protect, upload.single('file'), updateContract);

// Xóa hợp đồng
router.delete('/:id', protect, deleteContract);

// Tải xuống file hợp đồng
router.get('/:id/download', protect, downloadContract);

module.exports = router; 