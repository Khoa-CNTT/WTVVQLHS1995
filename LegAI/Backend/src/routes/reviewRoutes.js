const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReview,
  getReviewsByLawyer,
  updateReview,
  deleteReview,
  checkUserReview
} = require('../controllers/reviewController');

// Route để lấy thông tin chi tiết luật sư - công khai
router.route('/lawyer/:lawyerId')
  .get(getReviewsByLawyer);

// Route đánh giá luật sư - chỉ dành cho Admin
router.route('/lawyer/:lawyerId')
  .post(protect, (req, res, next) => {
    // Kiểm tra quyền và chuyển đổi về chữ thường để so sánh, không phân biệt hoa thường
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
      return next();
    }
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ quản trị viên mới có quyền đánh giá luật sư'
    });
  }, createReview);

// Route để kiểm tra xem người dùng có quyền đánh giá luật sư không
router.route('/check/:lawyerId')
  .get(protect, checkUserReview);

// Route để cập nhật đánh giá - chỉ dành cho Admin
router.route('/:id')
  .put(protect, (req, res, next) => {
    // Kiểm tra quyền và chuyển đổi về chữ thường để so sánh, không phân biệt hoa thường
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
      return next();
    }
    return res.status(403).json({
      status: 'error',
      message: 'Chỉ quản trị viên mới có quyền cập nhật đánh giá'
    });
  }, updateReview);

// Route để xóa đánh giá - tắt (hiện API này đã bị vô hiệu hóa)
router.route('/:id')
  .delete(protect, deleteReview);

module.exports = router; 