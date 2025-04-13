const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getReviewsByLawyer,
  updateReview,
  deleteReview,
  checkUserReview
} = require('../controllers/reviewController');

// Route để tạo đánh giá mới và lấy tất cả đánh giá của một luật sư
router.route('/lawyer/:lawyerId')
  .get(getReviewsByLawyer)
  .post(protect, createReview);

// Route để kiểm tra xem người dùng đã đánh giá luật sư chưa
router.route('/check/:lawyerId')
  .get(protect, checkUserReview);

// Route để cập nhật hoặc xóa đánh giá
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router; 