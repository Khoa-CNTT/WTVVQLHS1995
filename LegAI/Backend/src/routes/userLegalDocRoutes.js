const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const userLegalDocController = require('../controllers/userLegalDocController');

// Đảm bảo tất cả routes đều yêu cầu xác thực
router.use(authenticateToken);

// Lấy danh sách hồ sơ pháp lý cá nhân
router.get('/', userLegalDocController.getUserDocs);

// Lấy danh sách hồ sơ được chia sẻ với người dùng
router.get('/shared', userLegalDocController.getSharedDocs);

// Lấy danh sách các danh mục
router.get('/categories', userLegalDocController.getCategories);

// Tải lên hồ sơ pháp lý mới
router.post('/upload', userLegalDocController.uploadDoc);

// Lấy, cập nhật, và xóa thông tin chi tiết hồ sơ
router.route('/:id')
    .get(userLegalDocController.getDocById)
    .put(userLegalDocController.updateDoc)
    .delete(userLegalDocController.deleteDoc);

// Tải xuống hồ sơ pháp lý
router.get('/:id/download', userLegalDocController.downloadDoc);

// Chia sẻ hồ sơ pháp lý
router.post('/:id/share', userLegalDocController.shareDoc);

// Hủy chia sẻ hồ sơ pháp lý
router.post('/:id/unshare', userLegalDocController.unshareDoc);

// Phân tích hồ sơ pháp lý với AI
router.post('/:id/analyze', userLegalDocController.analyzeDoc);

// ----- ADMIN ROUTES -----
// Các routes dưới đây chỉ dành cho admin

// Lấy danh sách hồ sơ pháp lý của tất cả người dùng
router.get('/admin/all', authorize('admin'), userLegalDocController.getAllUserDocs);

// Lấy danh sách hồ sơ pháp lý của một người dùng cụ thể
router.get('/admin/users/:userId', authorize('admin'), userLegalDocController.getUserDocsById);

module.exports = router; 