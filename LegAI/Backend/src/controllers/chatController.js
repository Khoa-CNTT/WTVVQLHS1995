const chatModel = require('../models/chatModel');

// Lấy danh sách phiên chat theo trạng thái
const getChatsByStatus = async (req, res) => {
  try {
    const { status = 'waiting' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await chatModel.getChatsByStatus(status, page, limit);
    
    return res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Lỗi khi lấy phiên chat theo trạng thái:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy phiên chat'
    });
  }
};

// Lấy danh sách phiên chat của luật sư
const getChatsByLawyer = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const status = req.query.status || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`[API] Lấy phiên chat của luật sư (ID: ${lawyerId}) với trạng thái: ${status || 'tất cả'}`);
    console.log('Query parameters:', req.query);
    console.log('User info:', {
      id: req.user.id,
      role: req.user.role,
      name: req.user.full_name
    });
    
    // Đảm bảo status là kiểu dữ liệu chuỗi chính xác
    let validStatus = null;
    if (status === 'active' || status === 'closed' || status === 'waiting') {
      validStatus = status;
    }
    
    console.log('Status sau khi kiểm tra:', validStatus);
    
    try {
      const result = await chatModel.getChatsByLawyer(lawyerId, validStatus, page, limit);
      
      console.log(`API trả về ${result.data.length} phiên chat`);
      
      return res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (modelError) {
      console.error('Lỗi từ model khi lấy phiên chat của luật sư:', modelError);
      console.error('Chi tiết lỗi:', modelError.stack);
      
      // Trả về lỗi chi tiết hơn cho môi trường phát triển
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          status: 'error',
          message: 'Lỗi server khi lấy phiên chat',
          error: modelError.message,
          stack: modelError.stack
        });
      }
      
      throw modelError;
    }
  } catch (error) {
    console.error('Lỗi khi lấy phiên chat của luật sư:', error);
    console.error('Chi tiết lỗi:', error.stack);
    
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy phiên chat'
    });
  }
};

// Lấy phiên chat của một khách hàng
const getChatsByCustomer = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await chatModel.getChatsByCustomer(customerId, status, page, limit);
    
    return res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Lỗi khi lấy phiên chat của khách hàng:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy phiên chat'
    });
  }
};

// Tạo phiên chat mới
const createChat = async (req, res) => {
  try {
    // Kiểm tra xem người dùng đã đăng nhập đúng chưa
    if (!req.user || !req.user.id) {
      console.error('Lỗi: Không tìm thấy thông tin người dùng');
      return res.status(401).json({
        status: 'error',
        message: 'Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại'
      });
    }
    
    const customerId = req.user.id;
    
    console.log('Tạo phiên chat mới - Thông tin người dùng:', {
      userId: customerId,
      role: req.user.role,
      name: req.user.full_name || req.user.username || 'Unknown'
    });

    // Kiểm tra xem có phiên chat đang hoạt động không (tùy chọn)
    try {
      // Tạo phiên chat mới
      const newChat = await chatModel.createChat(customerId);
      
      console.log('Phiên chat đã được tạo thành công:', newChat);
      
      return res.status(201).json({
        status: 'success',
        data: newChat
      });
    } catch (dbError) {
      // Xử lý lỗi DB cụ thể
      console.error('Lỗi database khi tạo phiên chat:', dbError);
      
      // Chi tiết lỗi cho nhà phát triển
      if (process.env.NODE_ENV === 'development') {
        console.error('Chi tiết lỗi DB:', dbError.stack || JSON.stringify(dbError));
        
        // Kiểm tra lỗi khóa ngoại (foreign key)
        if (dbError.code === '23503') {
          return res.status(400).json({
            status: 'error',
            message: 'Không thể tạo phiên chat: ID người dùng không tồn tại',
            error: dbError.message
          });
        }
        
        // Kiểm tra lỗi vi phạm ràng buộc
        if (dbError.code === '23505') {
          return res.status(400).json({
            status: 'error',
            message: 'Không thể tạo phiên chat: Đã tồn tại phiên chat với thông tin tương tự',
            error: dbError.message
          });
        }
        
        return res.status(500).json({
          status: 'error',
          message: 'Lỗi server khi tạo phiên chat',
          error: dbError.message,
          code: dbError.code
        });
      }
      
      // Thông báo lỗi chung cho người dùng
      return res.status(500).json({
        status: 'error',
        message: 'Không thể tạo phiên chat, vui lòng thử lại sau'
      });
    }
  } catch (error) {
    console.error('Lỗi khi tạo phiên chat:', error);
    console.error('Chi tiết lỗi:', error.stack || error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi tạo phiên chat'
    });
  }
};

// Gán luật sư vào phiên chat
const assignLawyerToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const lawyerId = req.user.id;
    
    const updatedChat = await chatModel.assignLawyerToChat(chatId, lawyerId);
    
    return res.status(200).json({
      status: 'success',
      data: updatedChat
    });
  } catch (error) {
    console.error('Lỗi khi gán luật sư vào phiên chat:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi gán luật sư vào phiên chat'
    });
  }
};

// Đóng phiên chat
const closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const closedChat = await chatModel.closeChat(chatId);
    
    return res.status(200).json({
      status: 'success',
      data: closedChat
    });
  } catch (error) {
    console.error('Lỗi khi đóng phiên chat:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đóng phiên chat'
    });
  }
};

// Lấy thông tin chi tiết của một phiên chat
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await chatModel.getChatById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy phiên chat'
      });
    }
    
    // Kiểm tra xem người dùng có quyền truy cập phiên chat hay không
    const userId = req.user.id;
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    
    console.log('getChatById - Thông tin quyền truy cập:', {
      userInfo: {
        id: userId, 
        role: req.user.role,
        roleLowerCase: userRole
      },
      chatInfo: {
        chatId: chat.id,
        customerId: chat.customer_id,
        lawyerId: chat.lawyer_id,
        status: chat.status
      }
    });
    
    // Sửa: Kiểm tra các giá trị có thể null
    const customerId = chat.customer_id || null;
    const lawyerId = chat.lawyer_id || null;
    
    if (customerId !== userId && lawyerId !== userId && userRole !== 'admin' && userRole !== 'lawyer') {
      console.log('Từ chối quyền truy cập phiên chat');
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập phiên chat này'
      });
    }
    
    console.log('Cho phép truy cập phiên chat');
    return res.status(200).json({
      status: 'success',
      data: chat
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phiên chat:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy thông tin phiên chat'
    });
  }
};

// Thêm tin nhắn mới
const addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;
    
    console.log('Thông tin người dùng gửi tin nhắn:', {
      userId: senderId,
      userRole: req.user.role,
      chatId: chatId
    });
    
    // Kiểm tra xem phiên chat có tồn tại không
    const chat = await chatModel.getChatById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy phiên chat'
      });
    }

    console.log('Thông tin phiên chat:', chat);
    
    // Kiểm tra xem người dùng có quyền gửi tin nhắn trong phiên chat hay không
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const isAdmin = userRole === 'admin';
    const isLawyer = userRole === 'lawyer';
    
    // Cho phép admin và luật sư gửi tin nhắn trong bất kỳ phiên chat nào
    if (isAdmin || isLawyer) {
      console.log('Người dùng là admin hoặc luật sư, cho phép gửi tin nhắn');
      
      // Nếu là luật sư và phiên chat đang ở trạng thái waiting, tự động gán luật sư và chuyển trạng thái
      if (isLawyer && chat.status === 'waiting') {
        console.log(`Phiên chat ${chatId} đang ở trạng thái 'waiting', tự động gán luật sư ${senderId} và chuyển trạng thái thành 'active'`);
        try {
          const updatedChat = await chatModel.assignLawyerToChat(chatId, senderId);
          console.log('Đã gán luật sư và cập nhật trạng thái phiên chat:', updatedChat);
        } catch (assignError) {
          console.error('Lỗi khi gán luật sư vào phiên chat:', assignError);
          // Vẫn tiếp tục gửi tin nhắn ngay cả khi không thể gán luật sư
        }
      }
    } else if (chat.customer_id !== senderId && chat.lawyer_id !== senderId) {
      console.log('Không có quyền gửi tin nhắn: không phải khách hàng hoặc luật sư của phiên chat này');
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền gửi tin nhắn trong phiên chat này'
      });
    }
    
    // Kiểm tra xem phiên chat đã đóng chưa
    if (chat.status === 'closed') {
      return res.status(400).json({
        status: 'error',
        message: 'Phiên chat đã đóng, không thể gửi tin nhắn'
      });
    }
    
    const newMessage = await chatModel.addMessage(chatId, senderId, message);
    
    // Thêm thông tin người gửi
    const enrichedMessage = {
      ...newMessage,
      sender_name: req.user.full_name || req.user.username || 'Người dùng',
      sender_role: req.user.role || 'user'
    };
    
    console.log('Tin nhắn đã được thêm thành công:', enrichedMessage);
    
    return res.status(201).json({
      status: 'success',
      data: enrichedMessage
    });
  } catch (error) {
    console.error('Lỗi khi thêm tin nhắn:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi thêm tin nhắn'
    });
  }
};

// Lấy danh sách tin nhắn của một phiên chat
const getMessagesByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    console.log('getMessagesByChatId - Thông tin quyền truy cập:', {
      userInfo: {
        id: userId, 
        role: req.user.role,
        roleLowerCase: userRole
      },
      requestInfo: {
        chatId: chatId,
        page: page,
        limit: limit
      }
    });
    
    // Kiểm tra xem phiên chat có tồn tại không
    const chat = await chatModel.getChatById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy phiên chat'
      });
    }
    
    console.log('Thông tin phiên chat tìm thấy:', {
      id: chat.id,
      customerId: chat.customer_id,
      lawyerId: chat.lawyer_id,
      status: chat.status
    });
    
    // Sửa: Kiểm tra các giá trị có thể null
    const customerId = chat.customer_id || null;
    const lawyerId = chat.lawyer_id || null;
    
    // Kiểm tra xem người dùng có quyền xem tin nhắn trong phiên chat hay không
    if (customerId !== userId && lawyerId !== userId && userRole !== 'admin' && userRole !== 'lawyer') {
      console.log('Từ chối quyền xem tin nhắn - Không phải customer/lawyer/admin');
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xem tin nhắn trong phiên chat này'
      });
    }
    
    console.log('Cho phép xem tin nhắn - Kiểm tra quyền thành công');
    const messages = await chatModel.getMessagesByChatId(chatId, page, limit);
    
    // Đánh dấu tin nhắn đã đọc
    await chatModel.markMessagesAsRead(chatId, userId);
    
    return res.status(200).json({
      status: 'success',
      data: messages.data,
      pagination: messages.pagination
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tin nhắn:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy danh sách tin nhắn'
    });
  }
};

// Đếm số tin nhắn chưa đọc
const countUnreadMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await chatModel.countUnreadMessages(userId);
    
    return res.status(200).json({
      status: 'success',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Lỗi khi đếm tin nhắn chưa đọc:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đếm tin nhắn chưa đọc'
    });
  }
};

// Lấy số lượng phiên chat chờ xử lý
const getWaitingChatsCount = async (req, res) => {
  try {
    const waitingCount = await chatModel.getWaitingChatsCount();
    
    return res.status(200).json({
      status: 'success',
      data: { waitingCount }
    });
  } catch (error) {
    console.error('Lỗi khi đếm phiên chat chờ xử lý:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi đếm phiên chat chờ xử lý'
    });
  }
};

module.exports = {
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
}; 