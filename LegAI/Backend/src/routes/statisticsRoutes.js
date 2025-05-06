const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const statisticsController = require('../controllers/statisticsController');

// Lấy danh sách báo cáo (quyền admin, manager hoặc user xem báo cáo của mình)
router.get('/', protect, statisticsController.getReports);

// Tạo báo cáo mới
router.post('/', protect, statisticsController.createReport);

// Tạo báo cáo thống kê người dùng (tất cả người dùng)
router.get('/generate/user-statistics', protect, statisticsController.generateUserStatistics);

// Tạo báo cáo thống kê tài chính (chỉ admin và manager)
router.get('/generate/financial-statistics', protect, authorize('admin', 'manager'), statisticsController.generateFinancialStatistics);

// Tạo báo cáo thống kê hoạt động (tất cả người dùng)
router.get('/generate/activity-statistics', protect, statisticsController.generateActivityStatistics);

// Tạo báo cáo thống kê tổng hợp (chỉ admin và manager)
router.get('/generate/comprehensive-report', protect, authorize('admin', 'manager'), statisticsController.generateComprehensiveReport);

// Xuất báo cáo ra CSV (hỗ trợ cả GET và POST)
// Loại bỏ middleware protect, để controller tự xác thực qua token trong query
router.get('/:id/export-csv', statisticsController.exportReportToCSV);
router.post('/:id/export-csv', statisticsController.exportReportToCSVWithToken);

// Lấy báo cáo theo ID
router.get('/:id', protect, statisticsController.getReportById);

// Cập nhật báo cáo
router.put('/:id', protect, statisticsController.updateReport);

// Xóa báo cáo
router.delete('/:id', protect, statisticsController.deleteReport);

module.exports = router; 