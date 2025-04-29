const pool = require('../config/database');
const asyncHandler = require('../middleware/async');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const legalCaseModel = require('../models/legalCaseModel');
const auditLogModel = require('../models/auditLogModel');
const emailService = require('../services/emailService');
const ollamaService = require('../services/ollamaService');

// Tạo vụ án pháp lý mới
exports.createLegalCase = asyncHandler(async (req, res) => {
  try {
    const { case_type, description, title, ai_draft, template_id, user_input, extracted_content } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra dữ liệu đầu vào
    if (!case_type || !title) {
      // Nếu có file đã upload, xóa file đó
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ loại vụ án và tiêu đề'
      });
    }
    
    let caseData = {
      user_id: userId,
      case_type,
      title,
      description: description || '',
      status: 'draft'
    };
    
    // Xử lý nếu có file upload
    if (req.file) {
      // Tạo đường dẫn file để lưu vào DB
      const fileUrl = `/uploads/legal-cases/${req.file.filename}`;
      caseData.file_url = fileUrl;
      
      // Nếu có nội dung trích xuất từ file được gửi lên từ frontend
      if (extracted_content) {
        caseData.ai_content = extracted_content;
        caseData.is_ai_generated = false;
      } else {
        // Không có nội dung trích xuất, có thể thử đọc file text đơn giản
        try {
          const filePath = req.file.path;
          const fileExtension = path.extname(filePath).toLowerCase();
          
          // Hiện tại chỉ hỗ trợ đọc file text đơn giản
          if (fileExtension === '.txt') {
            const fileContent = await fs.readFile(filePath, 'utf8');
            caseData.ai_content = fileContent;
            caseData.is_ai_generated = false;
          } else {
            // Đối với các loại file khác, chỉ lưu thông tin file
            console.log('Không hỗ trợ trích xuất nội dung từ loại file:', fileExtension);
          }
        } catch (extractError) {
          console.error('Lỗi khi trích xuất nội dung file:', extractError);
          // Không lưu nội dung nếu có lỗi xảy ra
        }
      }
    }
    
    // Xử lý nếu sử dụng AI để soạn thảo
    if (ai_draft === 'true' && template_id && user_input) {
      // Lấy thông tin mẫu văn bản
      const template = await legalCaseModel.getDocumentTemplateById(template_id);
      
      if (!template) {
        // Nếu có file đã upload, xóa file đó
        if (req.file) {
          await fs.unlink(req.file.path);
        }
        
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mẫu văn bản'
        });
      }
      
      // Tạo prompt cho AI - Đảm bảo có mẫu nội dung
      if (!template.content) {
        template.content = '';
      }
      
      const prompt = `Bạn là trợ lý pháp lý chuyên nghiệp. Soạn thảo văn bản pháp lý dựa trên mẫu sau: ${template.content}. Người dùng yêu cầu: ${user_input}. Trả về văn bản hoàn chỉnh, đúng định dạng pháp lý, phù hợp với luật Việt Nam.`;
      
      // Gọi AI để tạo bản nháp - Thêm xử lý lỗi
      try {
        const aiResponse = await ollamaService.generateResponse(prompt);
        // Lưu bản nháp vào caseData
        caseData.ai_content = aiResponse;
        caseData.is_ai_generated = true;
      } catch (aiError) {
        console.error('Lỗi khi gọi AI để tạo bản nháp:', aiError);
        caseData.ai_content = `Không thể tạo bản nháp tự động cho yêu cầu: ${user_input}. Vui lòng thử lại sau.`;
        caseData.is_ai_generated = true;
      }
    }
    
    // Lưu vụ án vào database
    const newCase = await legalCaseModel.createLegalCase(caseData);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'CREATE_CASE',
      tableName: 'LegalCases',
      recordId: newCase.id,
      details: `Tạo vụ án mới: ${title}`
    });
    
    return res.status(201).json({
      success: true,
      data: newCase,
      message: 'Tạo vụ án mới thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi tạo vụ án:', error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Lỗi khi xóa file tạm thời:', unlinkError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo vụ án'
    });
  }
});

// Lấy danh sách vụ án của người dùng hiện tại
exports.getLegalCases = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const cases = await legalCaseModel.getLegalCasesByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách vụ án'
    });
  }
});

// Lấy chi tiết vụ án theo ID
exports.getLegalCaseById = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    
    // Kiểm tra quyền truy cập vụ án
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    // Kiểm tra quyền truy cập (chỉ chủ sở hữu hoặc luật sư được gán)
    const isOwner = legalCase.user_id === userId;
    const isAssignedLawyer = legalCase.lawyer_id === userId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vụ án này'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: legalCase
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chi tiết vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết vụ án'
    });
  }
});

// Tạo bản nháp bằng AI
exports.createAIDraft = asyncHandler(async (req, res) => {
  try {
    const { template_id, user_input, case_type, title } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra dữ liệu đầu vào
    if (!template_id || !user_input || !case_type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin mẫu, yêu cầu, loại vụ án và tiêu đề'
      });
    }
    
    // Lấy thông tin mẫu văn bản
    const template = await legalCaseModel.getDocumentTemplateById(template_id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mẫu văn bản'
      });
    }
    
    // Tạo prompt cho AI - Đảm bảo có mẫu nội dung
    if (!template.content) {
      template.content = '';
    }
    
    const prompt = `Bạn là trợ lý pháp lý chuyên nghiệp. Soạn thảo văn bản pháp lý dựa trên mẫu sau: ${template.content}. Người dùng yêu cầu: ${user_input}. Trả về văn bản hoàn chỉnh, đúng định dạng pháp lý, phù hợp với luật Việt Nam.`;
    
    // Gọi AI để tạo bản nháp - Thêm xử lý lỗi
    try {
      const aiResponse = await ollamaService.generateResponse(prompt);
      
      // Không lưu vào cơ sở dữ liệu mà chỉ trả về cho người dùng
      return res.status(200).json({
        success: true,
        data: {
          ai_content: aiResponse,
          template_id,
          case_type,
          title
        }
      });
    } catch (aiError) {
      console.error('Lỗi khi gọi AI để tạo bản nháp:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi gọi AI để tạo bản nháp'
      });
    }
    
  } catch (error) {
    console.error('Lỗi khi tạo bản nháp AI:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bản nháp AI'
    });
  }
});

// Gán vụ án cho luật sư
exports.assignLawyer = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { lawyer_id } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra dữ liệu đầu vào
    if (!lawyer_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn luật sư'
      });
    }
    
    // Kiểm tra vụ án tồn tại và thuộc về người dùng
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vụ án này'
      });
    }
    
    // Cập nhật vụ án với luật sư mới
    const updatedCase = await legalCaseModel.assignLawyer(caseId, lawyer_id);
    
    // Thêm dữ liệu vào LegalCases trước, sau đó xử lý Appointments riêng
    let appointmentResult = null;
    
    try {
      // Tạo thời gian mặc định cho lịch hẹn (hiện tại + 1 ngày)
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ngày mai
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);  // Kéo dài 1 giờ
      
      // Tạo lịch hẹn tư vấn với đầy đủ thông tin thời gian
      const appointmentData = {
        customer_id: userId,
        lawyer_id: lawyer_id,
        case_id: caseId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        notes: `Tư vấn cho vụ án: ${legalCase.title}`,
        purpose: 'Tư vấn pháp lý',
        appointment_type: 'case_consultation'
      };
      
      // Thử tạo lịch hẹn, nhưng không để lỗi ở đây ảnh hưởng đến việc gán luật sư
      appointmentResult = await legalCaseModel.createAppointment(appointmentData);
    } catch (appointmentError) {
      console.error('Lỗi khi tạo lịch hẹn tư vấn:', appointmentError);
      // Không ném lỗi, chỉ ghi log
    }
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'ASSIGN_LAWYER',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Gán luật sư ID ${lawyer_id} cho vụ án ID ${caseId}`
    });
    
    return res.status(200).json({
      success: true,
      data: {
        case: updatedCase,
        appointment: appointmentResult
      },
      message: 'Đã gán luật sư thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi gán luật sư cho vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gán luật sư cho vụ án'
    });
  }
});

// Tính phí vụ án
exports.calculateFee = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { parameters } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra vụ án tồn tại và thuộc về người dùng
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vụ án này'
      });
    }
    
    // Tính phí dựa trên loại vụ án và các tham số
    const feeDetails = await legalCaseModel.calculateFee(legalCase.case_type, parameters);
    
    // Cập nhật thông tin phí vào vụ án
    await legalCaseModel.updateFeeInfo(caseId, feeDetails);
    
    return res.status(200).json({
      success: true,
      data: feeDetails,
      message: 'Tính phí thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi tính phí vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tính phí vụ án'
    });
  }
});

// Tạo giao dịch thanh toán
exports.createPayment = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { payment_method } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra vụ án tồn tại và thuộc về người dùng
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vụ án này'
      });
    }
    
    // Kiểm tra đã tính phí chưa
    if (!legalCase.fee_amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tính phí trước khi thanh toán'
      });
    }
    
    // Tạo giao dịch thanh toán
    const paymentData = {
      user_id: userId,
      lawyer_id: legalCase.lawyer_id,
      case_id: caseId,
      amount: legalCase.fee_amount,
      payment_method,
      status: 'pending',
      description: `Thanh toán cho vụ án: ${legalCase.title}`
    };
    
    const transaction = await legalCaseModel.createPaymentTransaction(paymentData);
    
    // Tích hợp cổng thanh toán và tạo URL thanh toán
    // Đây là mock, trong thực tế sẽ gọi API của cổng thanh toán
    const paymentUrl = `http://localhost:3000/payment?transaction_id=${transaction.id}&amount=${legalCase.fee_amount}`;
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'CREATE_PAYMENT',
      tableName: 'Transactions',
      recordId: transaction.id,
      details: `Tạo giao dịch thanh toán cho vụ án ID ${caseId}, số tiền ${legalCase.fee_amount}`
    });
    
    return res.status(200).json({
      success: true,
      data: {
        transaction_id: transaction.id,
        payment_url: paymentUrl,
        amount: legalCase.fee_amount
      },
      message: 'Tạo giao dịch thanh toán thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo giao dịch thanh toán'
    });
  }
});

// Webhook xác nhận thanh toán từ cổng thanh toán
exports.paymentWebhook = asyncHandler(async (req, res) => {
  try {
    const { transaction_id, status, payment_info } = req.body;
    
    // Kiểm tra giao dịch tồn tại
    const transaction = await legalCaseModel.getTransactionById(transaction_id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    
    // Cập nhật trạng thái giao dịch
    const updatedTransaction = await legalCaseModel.updateTransactionStatus(
      transaction_id, 
      status,
      payment_info
    );
    
    // Nếu thanh toán thành công, cập nhật trạng thái vụ án
    if (status === 'completed') {
      await legalCaseModel.updateCaseStatus(transaction.case_id, 'paid');
      
      // Gửi email thông báo
      const userInfo = await legalCaseModel.getUserById(transaction.user_id);
      if (userInfo && userInfo.email) {
        await emailService.sendEmail({
          to: userInfo.email,
          subject: 'Thanh toán vụ án thành công',
          text: `Cảm ơn bạn đã thanh toán cho vụ án. Mã giao dịch: ${transaction_id}. Số tiền: ${transaction.amount}`
        });
      }
      
      // Ghi log
      await auditLogModel.addAuditLog({
        userId: transaction.user_id,
        action: 'PAYMENT_COMPLETED',
        tableName: 'Transactions',
        recordId: transaction_id,
        details: `Thanh toán thành công cho vụ án ID ${transaction.case_id}, số tiền ${transaction.amount}`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedTransaction,
      message: `Cập nhật trạng thái giao dịch thành ${status}`
    });
    
  } catch (error) {
    console.error('Lỗi khi xử lý webhook thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý webhook thanh toán'
    });
  }
});

// Tải xuống tài liệu vụ án
exports.downloadDocument = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    
    // Kiểm tra vụ án tồn tại và quyền truy cập
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    // Kiểm tra quyền truy cập (chủ sở hữu hoặc luật sư được gán)
    const isOwner = legalCase.user_id === userId;
    const isAssignedLawyer = legalCase.lawyer_id === userId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!isOwner && !isAssignedLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài liệu này'
      });
    }
    
    // Kiểm tra file_url có tồn tại không
    if (!legalCase.file_url) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu đính kèm'
      });
    }
    
    // Tạo đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '../../', legalCase.file_url);
    
    // Kiểm tra file tồn tại
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại hoặc đã bị xóa'
      });
    }
    
    // Lấy tên file từ đường dẫn
    const fileName = path.basename(legalCase.file_url);
    
    // Lấy extension của file
    const fileExt = path.extname(fileName).toLowerCase();
    
    // Xác định MIME type dựa trên extension
    let contentType = 'application/octet-stream';
    
    if (fileExt === '.pdf') {
      contentType = 'application/pdf';
    } else if (fileExt === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExt === '.doc') {
      contentType = 'application/msword';
    } else if (fileExt === '.jpg' || fileExt === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExt === '.png') {
      contentType = 'image/png';
    } else if (fileExt === '.txt') {
      contentType = 'text/plain';
    }
    
    // Tạo tên file thân thiện cho người dùng
    const originalFileName = `${legalCase.title}${fileExt}`;
    
    // Thiết lập header
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
    
    // Sử dụng res.download thay vì pipe stream
    res.download(filePath, originalFileName, (err) => {
      if (err) {
        console.error(`Lỗi khi tải xuống file: ${err.message}`);
        // Nếu đã gửi header thì không thể gửi lỗi dạng JSON
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Lỗi khi tải xuống file'
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Lỗi khi tải xuống tài liệu vụ án:`, error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải xuống tài liệu vụ án'
    });
  }
});

// Cập nhật thông tin vụ án
exports.updateLegalCase = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { title, description, case_type } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra vụ án tồn tại và thuộc về người dùng
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      // Nếu có file đã upload, xóa file đó
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    if (legalCase.user_id !== userId) {
      // Nếu có file đã upload, xóa file đó
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật vụ án này'
      });
    }
    
    // Tạo object dữ liệu cập nhật
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (case_type) updateData.case_type = case_type;
    
    // Xử lý nếu có file upload mới
    if (req.file) {
      // Tạo đường dẫn file mới để lưu vào DB
      const fileUrl = `/uploads/legal-cases/${req.file.filename}`;
      updateData.file_url = fileUrl;
      
      // Xóa file cũ nếu tồn tại
      if (legalCase.file_url) {
        const oldFilePath = path.join(__dirname, '../../', legalCase.file_url);
        try {
          // Kiểm tra file tồn tại trước khi xóa
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.error('Không thể xóa file cũ:', error);
          // Không ném lỗi, vẫn tiếp tục cập nhật
        }
      }
    }
    
    // Cập nhật vụ án
    const updatedCase = await legalCaseModel.updateLegalCase(caseId, updateData);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'UPDATE_CASE',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Cập nhật vụ án ID ${caseId}`
    });
    
    return res.status(200).json({
      success: true,
      data: updatedCase,
      message: 'Cập nhật vụ án thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi cập nhật vụ án:', error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Lỗi khi xóa file tạm thời:', unlinkError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật vụ án'
    });
  }
});

// Xóa vụ án
exports.deleteLegalCase = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    
    // Kiểm tra vụ án tồn tại và thuộc về người dùng
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa vụ án này'
      });
    }
    
    // Xóa file nếu tồn tại
    if (legalCase.file_url) {
      const filePath = path.join(__dirname, '../../', legalCase.file_url);
      try {
        // Kiểm tra file tồn tại trước khi xóa
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Không thể xóa file:', error);
        // Không ném lỗi, vẫn tiếp tục xóa vụ án
      }
    }
    
    // Xóa vụ án (soft delete)
    await legalCaseModel.deleteLegalCase(caseId);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'DELETE_CASE',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Xóa vụ án ID ${caseId}`
    });
    
    return res.status(200).json({
      success: true,
      message: 'Xóa vụ án thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi xóa vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa vụ án'
    });
  }
});

// Lấy danh sách loại vụ án
exports.getCaseTypes = asyncHandler(async (req, res) => {
  try {
    // Trả về dữ liệu mặc định trực tiếp
    return res.status(200).json({
      success: true,
      data: [
        { case_type: 'Dân sự', description: 'Tranh chấp dân sự, hợp đồng, đất đai' },
        { case_type: 'Hình sự', description: 'Bào chữa, tư vấn các vụ án hình sự' },
        { case_type: 'Hành chính', description: 'Khiếu nại, tố cáo hành chính' },
        { case_type: 'Lao động', description: 'Tranh chấp lao động, hợp đồng lao động' },
        { case_type: 'Hôn nhân gia đình', description: 'Ly hôn, phân chia tài sản, nuôi con' },
        { case_type: 'Kinh doanh thương mại', description: 'Tranh chấp thương mại, doanh nghiệp' },
        { case_type: 'Sở hữu trí tuệ', description: 'Bản quyền, nhãn hiệu, sáng chế' }
      ]
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách loại vụ án'
    });
  }
});

// Lấy danh sách vụ án của luật sư
exports.getLawyerCases = asyncHandler(async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    // Kiểm tra quyền (chỉ luật sư mới được phép gọi API này)
    const isLawyer = req.user.role && req.user.role.toLowerCase() === 'lawyer';
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!isLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập danh sách này'
      });
    }
    
    const cases = await legalCaseModel.getLegalCasesByLawyerId(lawyerId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án của luật sư:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách vụ án của luật sư'
    });
  }
});

// Cập nhật trạng thái vụ án
exports.updateCaseStatus = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { status, notes } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền (luật sư được gán hoặc admin)
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    const isAssignedLawyer = legalCase.lawyer_id === userId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!isAssignedLawyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật vụ án này'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Cập nhật trạng thái vụ án
    const updatedCase = await legalCaseModel.updateCaseStatus(caseId, status);
    
    // Nếu có ghi chú, cập nhật vào vụ án
    if (notes) {
      await legalCaseModel.updateLegalCase(caseId, { notes });
    }
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: userId,
      action: 'UPDATE_CASE_STATUS',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Cập nhật trạng thái vụ án ID ${caseId} thành ${status}`
    });
    
    return res.status(200).json({
      success: true,
      data: updatedCase,
      message: 'Cập nhật trạng thái vụ án thành công'
    });
    
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái vụ án:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái vụ án'
    });
  }
}); 