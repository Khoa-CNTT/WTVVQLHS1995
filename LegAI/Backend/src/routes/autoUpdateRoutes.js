const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  autoUpdateLegalDocuments,
  getNewUpdateNotifications,
  markNotificationAsShown
} = require('../controllers/autoUpdateController');

// Tất cả các routes đều yêu cầu xác thực và quyền admin
router.use(protect);
router.use(authorize('admin'));

// Routes cho tự động cập nhật dữ liệu
router.post('/legal-documents', autoUpdateLegalDocuments);
router.get('/notifications', getNewUpdateNotifications);
router.put('/notifications/:id', markNotificationAsShown);

module.exports = router; 