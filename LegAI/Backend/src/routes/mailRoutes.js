const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const { protect } = require('../middleware/auth');

// Route gửi email xác minh tài khoản
router.post('/send-verification', mailController.sendVerificationEmail);

// Route gửi email đặt lại mật khẩu
router.post('/send-password-reset', mailController.sendPasswordResetEmail);

// Route gửi email từ form liên hệ
router.post('/send-contact', mailController.sendContactEmail);

// Route gửi email xác nhận đến người dùng sau khi gửi form liên hệ
router.post('/send-contact-confirmation', mailController.sendContactConfirmationEmail);

// Route gửi email xác nhận đặt hẹn
router.post('/appointment-confirmation', mailController.sendAppointmentConfirmationEmail);

// Route gửi email hủy đặt hẹn
router.post('/appointment-cancellation', mailController.sendAppointmentCancellationEmail);

// Route gửi email cập nhật trạng thái cuộc hẹn
router.post('/appointment-status-update', mailController.sendAppointmentStatusUpdateEmail);

module.exports = router; 