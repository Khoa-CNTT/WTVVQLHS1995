const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getChatsByStatus,
  getChatsByLawyer,
  getChatsByCustomer,
  createChat,
  assignLawyerToChat,
  closeChat,
  getChatById,
  addMessage,
  getMessagesByChatId,
  countUnreadMessages,
  getWaitingChatsCount
} = require('../controllers/chatController');

// Route cho người dùng tạo phiên chat mới và lấy danh sách phiên chat của họ
router.route('/')
  .post(protect, createChat)
  .get(protect, (req, res, next) => {
    // Phân luồng logic dựa trên role của người dùng
    console.log('GET /chats request từ user:', req.user.id, 'role:', req.user.role);
    console.log('Query parameters:', req.query);
    console.log('Thông tin người dùng chi tiết:', {
      id: req.user.id,
      role: req.user.role,
      roleLowerCase: req.user.role ? req.user.role.toLowerCase() : 'không có role',
      fullName: req.user.full_name
    });
    
    // Chuyển role về chữ thường để tránh lỗi phân biệt hoa thường
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const isLawyer = userRole === 'lawyer';
    
    console.log(`Người dùng ${isLawyer ? 'là' : 'không phải là'} luật sư (role=${userRole})`);
    
    if (isLawyer) {
      console.log('Phân luồng cho luật sư');
      getChatsByLawyer(req, res, next);
    } else {
      console.log('Phân luồng cho khách hàng');
      getChatsByCustomer(req, res, next);
    }
  });

// Route chỉ dành cho admin/luật sư để lấy danh sách phiên chat theo trạng thái
router.route('/status')
  .get(protect, authorize('admin', 'lawyer'), getChatsByStatus);

// Route để lấy số lượng phiên chat chờ xử lý
router.route('/waiting-count')
  .get(protect, authorize('admin', 'lawyer'), getWaitingChatsCount);

// Route để đếm số tin nhắn chưa đọc của người dùng hiện tại
router.route('/unread-count')
  .get(protect, countUnreadMessages);

// Route để luật sư nhận phiên chat
router.route('/:chatId/assign')
  .put(protect, authorize('lawyer'), assignLawyerToChat);

// Route để đóng phiên chat
router.route('/:chatId/close')
  .put(protect, closeChat);

// Route để xem thông tin chi tiết phiên chat
router.route('/:chatId')
  .get(protect, getChatById);

// Route để gửi và lấy tin nhắn trong phiên chat
router.route('/:chatId/messages')
  .get(protect, getMessagesByChatId)
  .post(protect, addMessage);

module.exports = router; 