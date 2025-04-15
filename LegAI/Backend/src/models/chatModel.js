const pool = require('../config/database');

// Tạo phiên chat mới
const createChat = async (customerId, status = 'waiting') => {
  try {
    // Kiểm tra customerId có tồn tại không
    if (!customerId) {
      console.error('Lỗi: customerId không được cung cấp khi tạo phiên chat');
      throw new Error('customerId là bắt buộc');
    }
    
    console.log(`Bắt đầu tạo phiên chat mới với customerId=${customerId}, status=${status}`);
    
    // Sửa câu truy vấn - không đề cập đến cột end_time
    const query = `
      INSERT INTO LiveChats (customer_id, status) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    
    try {
      console.log('Thực hiện truy vấn SQL:', query);
      console.log('Với tham số:', [customerId, status]);
      
      const result = await pool.query(query, [customerId, status]);
      
      if (result.rows && result.rows.length > 0) {
        console.log('Tạo phiên chat thành công:', result.rows[0]);
        return result.rows[0];
      } else {
        console.error('Không có kết quả trả về khi tạo phiên chat');
        throw new Error('Không thể tạo phiên chat');
      }
    } catch (dbError) {
      console.error('Lỗi SQL khi tạo phiên chat:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Lỗi khi tạo phiên chat:', error);
    console.error('Chi tiết lỗi:', error.stack || error);
    throw error;
  }
};

// Kết nối luật sư vào phiên chat
const assignLawyerToChat = async (chatId, lawyerId) => {
  try {
    const query = `
      UPDATE LiveChats 
      SET lawyer_id = $1, status = 'active' 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [lawyerId, chatId]);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi gán luật sư vào phiên chat:', error);
    throw error;
  }
};

// Kết thúc phiên chat
const closeChat = async (chatId) => {
  try {
    const query = `
      UPDATE LiveChats 
      SET status = 'closed', end_time = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [chatId]);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi đóng phiên chat:', error);
    throw error;
  }
};

// Lấy danh sách phiên chat
const getChatsByStatus = async (status = 'waiting', page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const query = `
      SELECT lc.*, u.full_name as customer_name, u.email as customer_email 
      FROM LiveChats lc
      JOIN Users u ON lc.customer_id = u.id
      WHERE lc.status = $1
      ORDER BY lc.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [status, limit, offset]);
    
    // Lấy tổng số phiên chat theo trạng thái
    const countQuery = `
      SELECT COUNT(*) FROM LiveChats WHERE status = $1
    `;
    const countResult = await pool.query(countQuery, [status]);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiên chat:', error);
    throw error;
  }
};

// Lấy phiên chat của một luật sư
const getChatsByLawyer = async (lawyerId, status = null, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    let query, params, countQuery, countParams;
    
    // Tạo câu truy vấn cơ bản
    const baseQuery = `
      SELECT lc.*, u.full_name as customer_name, u.email as customer_email
      FROM LiveChats lc
      JOIN Users u ON lc.customer_id = u.id
    `;
    
    // Xử lý các trường hợp status khác nhau
    if (status === 'waiting') {
      // Chỉ lấy các phiên chat đang chờ
      query = `
        ${baseQuery}
        WHERE lc.status = 'waiting'
        ORDER BY lc.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
      
      countQuery = `
        SELECT COUNT(*) FROM LiveChats lc
        WHERE lc.status = 'waiting'
      `;
      countParams = [];
      
    } else if (status === 'active' || status === 'closed') {
      // Lấy các phiên chat active/closed của luật sư
      query = `
        ${baseQuery}
        WHERE lc.lawyer_id = $1 AND lc.status = $2
        ORDER BY lc.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      params = [lawyerId, status, limit, offset];
      
      countQuery = `
        SELECT COUNT(*) FROM LiveChats lc
        WHERE lc.lawyer_id = $1 AND lc.status = $2
      `;
      countParams = [lawyerId, status];
      
    } else {
      // Lấy tất cả phiên chat của luật sư và phiên chat đang chờ
      query = `
        ${baseQuery}
        WHERE lc.lawyer_id = $1 OR (lc.status = 'waiting')
        ORDER BY 
          CASE 
            WHEN lc.status = 'waiting' THEN 1
            WHEN lc.status = 'active' THEN 2
            WHEN lc.status = 'closed' THEN 3
            ELSE 4
          END,
          lc.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [lawyerId, limit, offset];
      
      countQuery = `
        SELECT COUNT(*) FROM LiveChats lc
        WHERE lc.lawyer_id = $1 OR (lc.status = 'waiting')
      `;
      countParams = [lawyerId];
    }
    

    
    // Thực hiện truy vấn DB
    try {
      const result = await pool.query(query, params);
      
      const countResult = await pool.query(countQuery, countParams);
      
      const total = parseInt(countResult.rows[0].count);
      
      
      return {
        data: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (dbError) {
      console.error('Lỗi khi thực hiện truy vấn DB:', dbError);
      console.error('Chi tiết lỗi DB:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Lỗi khi lấy phiên chat của luật sư:', error);
    console.error('Chi tiết lỗi:', error.stack);
    throw error;
  }
};

// Lấy phiên chat của một khách hàng
const getChatsByCustomer = async (customerId, status = null, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT lc.*, u.full_name as lawyer_name 
      FROM LiveChats lc
      LEFT JOIN Users u ON lc.lawyer_id = u.id
      WHERE lc.customer_id = $1
    `;
    
    const params = [customerId];
    let countParams = [customerId];
    let countQuery = `
      SELECT COUNT(*) FROM LiveChats WHERE customer_id = $1
    `;
    
    if (status) {
      query += ` AND lc.status = $2`;
      countQuery += ` AND status = $2`;
      params.push(status);
      countParams.push(status);
    }
    
    query += ` ORDER BY lc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Lỗi khi lấy phiên chat của khách hàng:', error);
    throw error;
  }
};

// Lấy thông tin chi tiết của một phiên chat
const getChatById = async (chatId) => {
  try {
    
    const query = `
      SELECT lc.*, 
             c.full_name as customer_name, c.email as customer_email, c.id as customer_id,
             l.full_name as lawyer_name, l.email as lawyer_email, l.id as lawyer_id,
             c.role as customer_role, l.role as lawyer_role
      FROM LiveChats lc
      JOIN Users c ON lc.customer_id = c.id
      LEFT JOIN Users l ON lc.lawyer_id = l.id
      WHERE lc.id = $1
    `;
    
    
    const result = await pool.query(query, [chatId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phiên chat:', error);
    throw error;
  }
};

// Thêm tin nhắn mới
const addMessage = async (chatId, senderId, message) => {
  try {
    
    const query = `
      INSERT INTO ChatMessages (chat_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    
    const result = await pool.query(query, [chatId, senderId, message]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi thêm tin nhắn:', error);
    throw error;
  }
};

// Lấy danh sách tin nhắn của một phiên chat
const getMessagesByChatId = async (chatId, page = 1, limit = 20) => {
  try {
    
    const offset = (page - 1) * limit;
    const query = `
      SELECT cm.*, 
             u.id as sender_id,
             u.full_name as sender_name, 
             u.role as sender_role,
             u.email as sender_email
      FROM ChatMessages cm
      JOIN Users u ON cm.sender_id = u.id
      WHERE cm.chat_id = $1
      ORDER BY cm.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [chatId, limit, offset]);
    
    // Lấy tổng số tin nhắn
    const countQuery = `
      SELECT COUNT(*) FROM ChatMessages WHERE chat_id = $1
    `;
    const countResult = await pool.query(countQuery, [chatId]);
    const total = parseInt(countResult.rows[0].count);
    
    
    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tin nhắn:', error);
    throw error;
  }
};

// Đánh dấu tin nhắn đã đọc
const markMessagesAsRead = async (chatId, userId) => {
  try {
    const query = `
      UPDATE ChatMessages
      SET is_read = true
      WHERE chat_id = $1 AND sender_id != $2 AND is_read = false
      RETURNING *
    `;
    const result = await pool.query(query, [chatId, userId]);
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    throw error;
  }
};

// Đếm số tin nhắn chưa đọc
const countUnreadMessages = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM ChatMessages cm
      JOIN LiveChats lc ON cm.chat_id = lc.id
      WHERE (lc.lawyer_id = $1 OR lc.customer_id = $1)
      AND cm.sender_id != $1
      AND cm.is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].unread_count, 10);
  } catch (error) {
    console.error('Lỗi khi đếm tin nhắn chưa đọc:', error);
    throw error;
  }
};

// Lấy số lượng phiên chat chờ xử lý
const getWaitingChatsCount = async () => {
  try {
    const query = `
      SELECT COUNT(*) as waiting_count
      FROM LiveChats
      WHERE status = 'waiting'
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].waiting_count, 10);
  } catch (error) {
    console.error('Lỗi khi đếm phiên chat chờ xử lý:', error);
    throw error;
  }
};

module.exports = {
  createChat,
  assignLawyerToChat,
  closeChat,
  getChatsByStatus,
  getChatsByLawyer,
  getChatsByCustomer,
  getChatById,
  addMessage,
  getMessagesByChatId,
  markMessagesAsRead,
  countUnreadMessages,
  getWaitingChatsCount
};