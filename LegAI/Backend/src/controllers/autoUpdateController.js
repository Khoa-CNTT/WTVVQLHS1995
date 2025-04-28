const asyncHandler = require('../middleware/async');
const autoUpdateService = require('../services/autoUpdateService');

// @desc    Tự động cập nhật văn bản pháp luật
// @route   POST /api/auto-update/legal-documents
// @access  Private/Admin
exports.autoUpdateLegalDocuments = asyncHandler(async (req, res, next) => {
  try {
    // Lấy giới hạn từ query params hoặc body
    const limit = req.body.limit || req.query.limit || 10;
    
    console.log(`Bắt đầu tự động cập nhật văn bản pháp luật với giới hạn ${limit}...`);
    
    // Tự động cập nhật văn bản
    const result = await autoUpdateService.autoUpdateLegalDocuments(limit);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        count: result.count,
        total: result.total
      }
    });
  } catch (error) {
    console.error('Lỗi khi tự động cập nhật văn bản pháp luật:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tự động cập nhật văn bản pháp luật'
    });
  }
});

// @desc    Lấy thông báo cập nhật tự động mới
// @route   GET /api/auto-update/notifications
// @access  Private/Admin
exports.getNewUpdateNotifications = asyncHandler(async (req, res, next) => {
  try {
    const notifications = await autoUpdateService.getNewUpdateNotifications();
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông báo cập nhật tự động:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo cập nhật tự động'
    });
  }
});

// @desc    Đánh dấu thông báo đã được hiển thị
// @route   PUT /api/auto-update/notifications/:id
// @access  Private/Admin
exports.markNotificationAsShown = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không được cung cấp'
      });
    }
    
    const result = await autoUpdateService.markNotificationAsShown(id);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu thông báo là đã hiển thị'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo với ID đã cung cấp'
      });
    }
  } catch (error) {
    console.error('Lỗi khi đánh dấu thông báo:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu thông báo'
    });
  }
}); 