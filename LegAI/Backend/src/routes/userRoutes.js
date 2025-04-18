const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer để lưu trữ file
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
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
    filename: function(req, file, cb) {
        // Tạo tên file duy nhất
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'avatar-' + uniqueSuffix + ext;
        console.log('Tên file được tạo:', filename);
        cb(null, filename);
    }
});

// Filter chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ hỗ trợ định dạng JPEG, JPG hoặc PNG!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

// Route đăng ký
router.post('/register', userController.register);

// Route xác minh tài khoản
router.post('/verify-account', userController.verifyAccount);

// Route lấy danh sách người dùng (có bảo vệ)
router.get('/users', authenticateToken, userController.getUsers);

// Route lấy thông tin người dùng theo ID
router.get('/users/:userId', userController.getUserById);

// Route cập nhật thông tin người dùng
router.put('/users/:userId', authenticateToken, userController.updateUser);

// Route xóa người dùng
router.delete('/users/:userId', authenticateToken, userController.deleteUser);

// Route khóa/mở khóa tài khoản người dùng (có bảo vệ)
router.patch('/users/:userId/toggle-lock', authenticateToken, userController.toggleUserLock);

// Route đặt lại mật khẩu (yêu cầu quyền admin)
router.post('/users/:userId/reset-password', authenticateToken, userController.resetPassword);

// Route quên mật khẩu (không yêu cầu xác thực)
router.post('/forgot-password', userController.forgotPassword);

// Route xác minh token đặt lại mật khẩu
router.post('/verify-reset-token', userController.verifyResetToken);

// Route đổi mật khẩu (có bảo vệ)
router.post('/change-password', authenticateToken, userController.changePassword);

// Route kiểm tra ràng buộc DB (demo)
router.get('/check-constraints', userController.checkDatabaseConstraints);

// Route lấy thống kê người dùng
router.get('/users/:userId/stats', authenticateToken, userController.getUserStats);

// Route đăng ký làm luật sư - Upload nhiều file với các fieldname khác nhau
router.post('/register-lawyer', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'certificationFile', maxCount: 1 }
]), userController.registerLawyer);

// Route lấy danh sách luật sư
router.get('/lawyers', userController.getAllLawyers);

// Route lấy thông tin chi tiết luật sư theo ID
router.get('/lawyers/:id', userController.getLawyerById);

// Route upload avatar - sửa đường dẫn để đúng định dạng
router.post('/:userId/avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
