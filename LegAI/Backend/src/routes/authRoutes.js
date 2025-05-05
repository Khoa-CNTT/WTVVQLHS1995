// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Xác định thư mục lưu trữ chính xác
        const uploadPath = path.join(__dirname, '../../uploads');
        // Log để debug
        console.log('Đường dẫn upload:', uploadPath);
        // Đảm bảo thư mục tồn tại
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        console.log('Tên file được tạo:', filename);
        cb(null, filename);
    }
});

// Filter chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ hỗ trợ định dạng JPEG, JPG, PNG hoặc PDF!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

// Routes công khai
router.post('/login', authController.login);
router.post('/register', userController.register);
router.post('/verify', userController.verifyAccount);

// Route đăng ký luật sư (xử lý cả upload file)
router.post('/register-lawyer', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'certificationFile', maxCount: 1 }
]), userController.registerLawyer);

// Routes quên mật khẩu
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-reset-token', userController.verifyResetToken);
router.post('/change-password', userController.changePassword);

// Routes được bảo vệ (yêu cầu xác thực)
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/:userId', authenticateToken, userController.getUserById);
router.get('/users/:userId/stats', authenticateToken, userController.getUserStats);
router.put('/users/:userId', authenticateToken, userController.updateUser);
router.delete('/users/:userId', authenticateToken, userController.deleteUser);
router.patch('/users/:userId/toggle-lock', authenticateToken, userController.toggleUserLock);
router.post('/users/:userId/reset-password', authenticateToken, userController.resetPassword);

// Route cho developer kiểm tra ràng buộc database
router.get('/check-constraints/:tableName', authenticateToken, userController.checkDatabaseConstraints);

// Routes cho luật sư - có thể truy cập công khai
router.get('/lawyers', userController.getAllLawyers);
router.get('/lawyers/:id', userController.getLawyerById);

// Route kiểm tra token
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Token hợp lệ',
        user: req.user
    });
});

// Route ví dụ cần bảo vệ
router.get('/protected', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Đây là route được bảo vệ',
        user: req.user
    });
});

module.exports = router;