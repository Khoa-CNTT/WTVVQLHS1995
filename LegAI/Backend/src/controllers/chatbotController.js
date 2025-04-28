const asyncHandler = require('../middleware/async');
const axios = require('axios');
const auditLogModel = require('../models/auditLogModel');
const userLegalDocModel = require('../models/userLegalDocModel');
const legalDocumentModel = require('../models/legalDocumentModel');
const contractModel = require('../models/contractModel');

// Cấu hình URL của Rasa server
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// @desc    Gửi tin nhắn đến Rasa và trả về phản hồi
// @route   POST /api/chatbot/message
// @access  Public (khách có thể chat, người dùng đã đăng nhập sẽ có thêm ngữ cảnh)
exports.sendMessage = asyncHandler(async (req, res, next) => {
  try {
    const { message, sender_id, user_info } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung tin nhắn'
      });
    }
    
    // ID người gửi mặc định nếu không có
    const senderId = sender_id || (req.user ? `user_${req.user.id}` : `guest_${Date.now()}`);
    
    // Ghi nhận thông tin người dùng nếu có
    let userContext = {};
    if (req.user) {
      userContext = {
        user_id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        is_authenticated: true
      };
    } else if (user_info) {
      userContext = {
        ...user_info,
        is_authenticated: false
      };
    }
    
    // Gửi tin nhắn đến Rasa server
    const rasaResponse = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, {
      message,
      sender: senderId,
      metadata: {
        user_context: userContext
      }
    });
    
    // Ghi log tương tác với chatbot nếu người dùng đã đăng nhập
    if (req.user) {
      await auditLogModel.addAuditLog({
        userId: req.user.id,
        action: 'CHATBOT_INTERACTION',
        tableName: 'None',
        recordId: 0,
        details: `Người dùng hỏi: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
        notificationShown: true
      });
    }
    
    // Xử lý phản hồi từ Rasa
    let botResponses = [];
    if (rasaResponse.data && rasaResponse.data.length > 0) {
      botResponses = rasaResponse.data.map(response => ({
        text: response.text,
        buttons: response.buttons || [],
        image: response.image || null,
        custom: response.custom || null
      }));
    } else {
      botResponses = [{
        text: 'Xin lỗi, tôi không hiểu ý bạn. Vui lòng thử lại hoặc diễn đạt theo cách khác.',
        buttons: []
      }];
    }
    
    return res.status(200).json({
      success: true,
      sender_id: senderId,
      responses: botResponses
    });
  } catch (error) {
    console.error('Lỗi khi xử lý tin nhắn chatbot:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý tin nhắn của bạn'
    });
  }
});

// @desc    Lấy lịch sử trò chuyện với chatbot
// @route   GET /api/chatbot/history/:senderId
// @access  Private
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  try {
    const { senderId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    // Kiểm tra quyền truy cập lịch sử
    const userPrefix = `user_${req.user.id}`;
    if (!senderId.startsWith(userPrefix) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập lịch sử trò chuyện này'
      });
    }
    
    // Gọi đến Rasa API để lấy lịch sử trò chuyện
    // (Lưu ý: Tính năng này cần được cấu hình trong Rasa)
    const historyResponse = await axios.get(`${RASA_URL}/conversations/${senderId}/tracker`, {
      params: { limit }
    });
    
    const events = historyResponse.data.events || [];
    
    // Lọc ra các tin nhắn từ người dùng và bot
    const messages = events
      .filter(event => event.event === 'user' || event.event === 'bot')
      .map(event => {
        if (event.event === 'user') {
          return {
            type: 'user',
            text: event.text,
            timestamp: event.timestamp
          };
        } else {
          return {
            type: 'bot',
            text: event.text,
            buttons: event.data?.buttons || [],
            image: event.data?.image || null,
            custom: event.data?.custom || null,
            timestamp: event.timestamp
          };
        }
      });
    
    return res.status(200).json({
      success: true,
      sender_id: senderId,
      messages
    });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử trò chuyện:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử trò chuyện'
    });
  }
});

// @desc    Thực hiện hành động được yêu cầu bởi chatbot
// @route   POST /api/chatbot/action
// @access  Private
exports.executeAction = asyncHandler(async (req, res, next) => {
  try {
    const { action, params } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên hành động'
      });
    }
    
    let result = { success: false, message: 'Hành động không được hỗ trợ' };
    
    // Thực hiện các hành động khác nhau dựa trên yêu cầu
    switch (action) {
      case 'search_legal_document':
        result = await searchLegalDocument(params, req.user);
        break;
        
      case 'get_legal_document':
        result = await getLegalDocumentDetails(params, req.user);
        break;
        
      case 'upload_document':
        // Yêu cầu người dùng đã đăng nhập
        if (!req.user) {
          result = { 
            success: false, 
            message: 'Vui lòng đăng nhập để tải lên tài liệu' 
          };
          break;
        }
        result = { 
          success: true, 
          message: 'Chức năng tải lên tài liệu đang được chuyển hướng',
          redirect: '/legal-docs?upload=true'
        };
        break;
        
      case 'create_contract':
        // Yêu cầu người dùng đã đăng nhập
        if (!req.user) {
          result = { 
            success: false, 
            message: 'Vui lòng đăng nhập để tạo hợp đồng' 
          };
          break;
        }
        result = { 
          success: true, 
          message: 'Chức năng tạo hợp đồng đang được chuyển hướng',
          redirect: '/contracts?create=true'
        };
        break;
        
      case 'compare_documents':
        result = await compareDocuments(params, req.user);
        break;
        
      case 'calculate_fee':
        result = await calculateServiceFee(params);
        break;
        
      // Thêm các hành động khác ở đây
        
      default:
        result = { 
          success: false, 
          message: `Hành động '${action}' không được hỗ trợ` 
        };
    }
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(`Lỗi khi thực hiện hành động:`, error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện hành động được yêu cầu'
    });
  }
});

// @desc    Khởi tạo phiên trò chuyện mới với chatbot
// @route   POST /api/chatbot/start
// @access  Public
exports.startConversation = asyncHandler(async (req, res, next) => {
  try {
    // Tạo ID người gửi dựa trên thông tin người dùng nếu có
    const { sender_id, user_info } = req.body;
    
    const userId = req.user ? req.user.id : (user_info ? 'guest' : `guest_${Date.now()}`);
    const conversationId = sender_id || `${req.user ? 'user' : 'guest'}_${userId}_${Date.now()}`;
    
    // Khởi tạo cuộc trò chuyện trên Rasa server
    await axios.post(`${RASA_URL}/conversations/${conversationId}/tracker/events`, {
      event: 'restart'
    });
    
    // Thêm thông tin người dùng vào slots nếu có
    if (req.user || user_info) {
      const userContext = req.user 
        ? {
            user_id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            is_authenticated: true
          }
        : {
            ...user_info,
            is_authenticated: false
          };
      
      await axios.post(`${RASA_URL}/conversations/${conversationId}/tracker/events`, {
        event: 'slot',
        name: 'user_context',
        value: userContext
      });
    }
    
    // Ghi log khởi tạo trò chuyện nếu người dùng đã đăng nhập
    if (req.user) {
      await auditLogModel.addAuditLog({
        userId: req.user.id,
        action: 'CHATBOT_START',
        tableName: 'None',
        recordId: 0,
        details: 'Người dùng bắt đầu cuộc trò chuyện mới với chatbot',
        notificationShown: true
      });
    }
    
    return res.status(200).json({
      success: true,
      conversation_id: conversationId,
      message: 'Cuộc trò chuyện mới đã được khởi tạo'
    });
  } catch (error) {
    console.error('Lỗi khi khởi tạo cuộc trò chuyện mới:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khởi tạo cuộc trò chuyện mới'
    });
  }
});

// @desc    Đặt ngữ cảnh cho cuộc trò chuyện hiện tại
// @route   POST /api/chatbot/context
// @access  Public
exports.setConversationContext = asyncHandler(async (req, res, next) => {
  try {
    const { sender_id, context } = req.body;
    
    if (!sender_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID người gửi'
      });
    }
    
    if (!context || typeof context !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngữ cảnh hợp lệ'
      });
    }
    
    // Đặt ngữ cảnh (context) vào slot của Rasa
    const events = Object.entries(context).map(([key, value]) => ({
      event: 'slot',
      name: key,
      value: value
    }));
    
    await axios.post(`${RASA_URL}/conversations/${sender_id}/tracker/events`, events);
    
    return res.status(200).json({
      success: true,
      message: 'Đã đặt ngữ cảnh cho cuộc trò chuyện'
    });
  } catch (error) {
    console.error('Lỗi khi đặt ngữ cảnh cuộc trò chuyện:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt ngữ cảnh cuộc trò chuyện'
    });
  }
});

// Hàm hỗ trợ tìm kiếm văn bản pháp luật
async function searchLegalDocument(params, user) {
  try {
    const { query, document_type, issuing_body, field, limit = 5 } = params;
    
    if (!query && !document_type && !issuing_body && !field) {
      return {
        success: false,
        message: 'Vui lòng cung cấp ít nhất một tham số tìm kiếm'
      };
    }
    
    // Tìm kiếm văn bản pháp luật từ cơ sở dữ liệu
    const searchParams = {
      searchTerm: query || '',
      documentType: document_type || '',
      issuingBody: issuing_body || '',
      field: field || '',
      limit: parseInt(limit)
    };
    
    const searchResults = await legalDocumentModel.searchAll(searchParams);
    
    // Ghi log tìm kiếm nếu người dùng đã đăng nhập
    if (user) {
      await auditLogModel.addAuditLog({
        userId: user.id,
        action: 'SEARCH_LEGAL_DOCUMENT',
        tableName: 'LegalDocuments',
        recordId: 0,
        details: `Tìm kiếm văn bản: "${query || 'không có từ khóa'}"`,
        notificationShown: true
      });
    }
    
    return {
      success: true,
      count: searchResults.length,
      documents: searchResults.map(doc => ({
        id: doc.id,
        title: doc.title,
        document_number: doc.document_number,
        document_type: doc.document_type,
        issuing_body: doc.issuing_body,
        issue_date: doc.issue_date,
        url: `/legal/documents/${doc.id}`
      }))
    };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản pháp luật:', error);
    return {
      success: false,
      message: 'Lỗi khi tìm kiếm văn bản pháp luật'
    };
  }
}

// Hàm hỗ trợ lấy chi tiết văn bản pháp luật
async function getLegalDocumentDetails(params, user) {
  try {
    const { document_id } = params;
    
    if (!document_id) {
      return {
        success: false,
        message: 'Vui lòng cung cấp ID văn bản'
      };
    }
    
    // Lấy chi tiết văn bản pháp luật từ cơ sở dữ liệu
    const document = await legalDocumentModel.getLegalDocumentById(document_id);
    
    if (!document) {
      return {
        success: false,
        message: 'Không tìm thấy văn bản pháp luật'
      };
    }
    
    // Ghi log xem chi tiết nếu người dùng đã đăng nhập
    if (user) {
      await auditLogModel.addAuditLog({
        userId: user.id,
        action: 'VIEW_LEGAL_DOCUMENT',
        tableName: 'LegalDocuments',
        recordId: document.id,
        details: `Xem chi tiết văn bản: "${document.title}"`,
        notificationShown: true
      });
    }
    
    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        document_number: document.document_number,
        document_type: document.document_type,
        issuing_body: document.issuing_body,
        issue_date: document.issue_date,
        effective_date: document.effective_date,
        expiry_date: document.expiry_date,
        content: document.content,
        summary: document.summary,
        status: document.status,
        url: `/legal/documents/${document.id}`
      }
    };
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết văn bản pháp luật:', error);
    return {
      success: false,
      message: 'Lỗi khi lấy chi tiết văn bản pháp luật'
    };
  }
}

// Hàm hỗ trợ so sánh văn bản pháp luật
async function compareDocuments(params, user) {
  try {
    const { document_id1, document_id2 } = params;
    
    if (!document_id1 || !document_id2) {
      return {
        success: false,
        message: 'Vui lòng cung cấp ID của hai văn bản cần so sánh'
      };
    }
    
    // Lấy chi tiết của hai văn bản
    const document1 = await legalDocumentModel.getLegalDocumentById(document_id1);
    const document2 = await legalDocumentModel.getLegalDocumentById(document_id2);
    
    if (!document1 || !document2) {
      return {
        success: false,
        message: 'Không tìm thấy một hoặc cả hai văn bản pháp luật'
      };
    }
    
    // Ghi log so sánh văn bản nếu người dùng đã đăng nhập
    if (user) {
      await auditLogModel.addAuditLog({
        userId: user.id,
        action: 'COMPARE_LEGAL_DOCUMENTS',
        tableName: 'LegalDocuments',
        recordId: document1.id,
        details: `So sánh văn bản: "${document1.title}" và "${document2.title}"`,
        notificationShown: true
      });
    }
    
    // Đây chỉ là một phản hồi đơn giản
    // Trong thực tế, cần có thuật toán so sánh phức tạp hơn
    return {
      success: true,
      message: 'Đang chuyển hướng đến trang so sánh văn bản',
      redirect: `/legal/compare?doc1=${document_id1}&doc2=${document_id2}`,
      documents: [
        {
          id: document1.id,
          title: document1.title,
          document_number: document1.document_number,
          document_type: document1.document_type,
          issue_date: document1.issue_date
        },
        {
          id: document2.id,
          title: document2.title,
          document_number: document2.document_number,
          document_type: document2.document_type,
          issue_date: document2.issue_date
        }
      ]
    };
  } catch (error) {
    console.error('Lỗi khi so sánh văn bản pháp luật:', error);
    return {
      success: false,
      message: 'Lỗi khi so sánh văn bản pháp luật'
    };
  }
}

// Hàm hỗ trợ tính phí dịch vụ
async function calculateServiceFee(params) {
  try {
    const { service_type, duration, complexity } = params;
    
    if (!service_type) {
      return {
        success: false,
        message: 'Vui lòng cung cấp loại dịch vụ'
      };
    }
    
    // Biểu phí cơ bản (đơn vị: VNĐ)
    const baseFees = {
      legal_consultation: 500000, // Tư vấn pháp lý
      document_review: 1000000,   // Rà soát tài liệu
      contract_drafting: 2000000, // Soạn thảo hợp đồng
      case_representation: 5000000 // Đại diện vụ việc
    };
    
    // Hệ số thời gian
    const durationMultiplier = {
      short: 1,    // Ngắn hạn
      medium: 1.5, // Trung hạn
      long: 2      // Dài hạn
    };
    
    // Hệ số độ phức tạp
    const complexityMultiplier = {
      low: 1,      // Đơn giản
      medium: 1.5, // Trung bình
      high: 2.5    // Phức tạp
    };
    
    // Tính phí dịch vụ
    const baseFee = baseFees[service_type] || 500000;
    const durationMulti = durationMultiplier[duration] || 1;
    const complexityMulti = complexityMultiplier[complexity] || 1;
    
    const totalFee = baseFee * durationMulti * complexityMulti;
    
    return {
      success: true,
      service_type,
      base_fee: baseFee,
      duration_factor: durationMulti,
      complexity_factor: complexityMulti,
      total_fee: Math.round(totalFee),
      currency: 'VNĐ',
      note: 'Đây là báo giá ước tính. Chi phí thực tế có thể thay đổi tùy thuộc vào chi tiết cụ thể của vụ việc.'
    };
  } catch (error) {
    console.error('Lỗi khi tính phí dịch vụ:', error);
    return {
      success: false,
      message: 'Lỗi khi tính phí dịch vụ'
    };
  }
}

// Thêm các hàm hỗ trợ khác ở đây nếu cần 