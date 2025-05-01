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
    const { 
      case_type, 
      description, 
      title, 
      ai_draft, 
      template_id, 
      user_input, 
      ai_content, 
      extracted_content,
      is_ai_generated 
    } = req.body;
    
    const userId = req.user.id;
    
    console.log('[BACKEND] Nhận request tạo vụ án:', {
      case_type, 
      title,
      ai_draft: ai_draft === 'true',
      has_template: !!template_id,
      has_user_input: !!user_input,
      has_ai_content: !!ai_content,
      has_extracted_content: !!extracted_content,
      is_ai_generated: is_ai_generated === 'true',
      has_file: !!req.file
    });
    
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
    
    // Xử lý nội dung AI hoặc file
    // Ưu tiên sử dụng ai_content nếu có, sau đó đến extracted_content
    if (ai_content) {
      console.log('[BACKEND] Sử dụng ai_content từ request');
      caseData.ai_content = ai_content;
      caseData.is_ai_generated = is_ai_generated === 'true';
    } else if (extracted_content) {
      console.log('[BACKEND] Sử dụng extracted_content từ request');
      caseData.ai_content = extracted_content;
      caseData.is_ai_generated = is_ai_generated === 'true';
    }
    
    // Xử lý nếu có file upload
    if (req.file) {
      // Tạo đường dẫn file để lưu vào DB
      const fileUrl = `/uploads/legal-cases/${req.file.filename}`;
      caseData.file_url = fileUrl;
      console.log('[BACKEND] File đã được lưu tại:', fileUrl);
      
      // Nếu không có nội dung từ frontend, thử đọc nội dung từ file
      if (!caseData.ai_content) {
        try {
          const filePath = req.file.path;
          const fileExtension = path.extname(filePath).toLowerCase();
          
          console.log('[BACKEND] Đọc nội dung từ file với định dạng:', fileExtension);
          
          // Hiện tại chỉ hỗ trợ đọc file text đơn giản
          if (fileExtension === '.txt') {
            const fileContent = await fs.readFile(filePath, 'utf8');
            caseData.ai_content = fileContent;
            caseData.is_ai_generated = false;
            console.log('[BACKEND] Đã đọc nội dung từ file text, độ dài:', fileContent.length);
          } else {
            // Đối với các loại file khác, chỉ lưu thông tin file
            console.log('[BACKEND] Không hỗ trợ trích xuất nội dung từ loại file:', fileExtension);
          }
        } catch (extractError) {
          console.error('[BACKEND] Lỗi khi trích xuất nội dung file:', extractError);
          // Không lưu nội dung nếu có lỗi xảy ra
        }
      }
    }
    
    // Xử lý nếu sử dụng AI để soạn thảo
    if (ai_draft === 'true' && template_id && user_input && !caseData.ai_content) {
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
        console.log('[BACKEND] Đã tạo nội dung AI thành công, độ dài:', aiResponse.length);
      } catch (aiError) {
        console.error('[BACKEND] Lỗi khi gọi AI để tạo bản nháp:', aiError);
        caseData.ai_content = `Không thể tạo bản nháp tự động cho yêu cầu: ${user_input}. Vui lòng thử lại sau.`;
        caseData.is_ai_generated = true;
      }
    }
    
    // Kiểm tra lại một lần nữa trước khi lưu
    console.log('[BACKEND] Chuẩn bị lưu dữ liệu vào DB:', {
      has_ai_content: !!caseData.ai_content,
      is_ai_generated: caseData.is_ai_generated,
      has_file_url: !!caseData.file_url
    });
    
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
    console.error('[BACKEND] Lỗi khi tạo vụ án:', error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('[BACKEND] Lỗi khi xóa file tạm thời:', unlinkError);
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
    
    // Đảm bảo trường lawyer luôn tồn tại với cấu trúc nhất quán
    if (!legalCase.lawyer && legalCase.lawyer_id) {
      // Nếu có lawyer_id nhưng không có thông tin lawyer, lấy thêm thông tin
      try {
        const lawyerQuery = `
          SELECT id, username, full_name, email, phone
          FROM Users
          WHERE id = $1
        `;
        const lawyerResult = await pool.query(lawyerQuery, [legalCase.lawyer_id]);
        
        if (lawyerResult.rows.length > 0) {
          legalCase.lawyer = {
            id: lawyerResult.rows[0].id,
            username: lawyerResult.rows[0].username,
            full_name: lawyerResult.rows[0].full_name,
            email: lawyerResult.rows[0].email,
            phone: lawyerResult.rows[0].phone
          };
        }
      } catch (lawyerError) {
        console.error('Lỗi khi lấy thông tin luật sư bổ sung:', lawyerError);
        // Không để lỗi này ảnh hưởng đến response
      }
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

// Gán luật sư cho vụ án
exports.assignLawyer = asyncHandler(async (req, res) => {
  try {
    const caseId = req.params.id;
    const { lawyer_id } = req.body;
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
        message: 'Bạn không có quyền gán luật sư cho vụ án này'
      });
    }
    
    // Kiểm tra luật sư tồn tại
    const lawyer = await legalCaseModel.getUserById(lawyer_id);
    
    if (!lawyer || lawyer.role.toLowerCase() !== 'lawyer') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy luật sư'
      });
    }
    
    // Gán luật sư cho vụ án
    const updatedCase = await legalCaseModel.assignLawyer(caseId, lawyer_id);
    
    // Cập nhật trạng thái vụ án thành "đang chờ xử lý" sau khi gán luật sư
    await legalCaseModel.updateCaseStatus(caseId, 'pending');
    
    // Tạo cuộc hẹn mặc định
    try {
      const appointmentData = {
        user_id: userId,
        lawyer_id,
        case_id: caseId,
        title: `Tư vấn về vụ án: ${legalCase.title}`,
        description: 'Cuộc hẹn tư vấn ban đầu',
        appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
        duration_minutes: 30,
        status: 'pending'
      };
      
      await legalCaseModel.createAppointment(appointmentData);
    } catch (appointmentError) {
      console.error('Lỗi khi tạo cuộc hẹn:', appointmentError);
      // Không trả về lỗi ngay, vì việc chính là gán luật sư đã thành công
    }
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId,
      action: 'ASSIGN_LAWYER',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Gán luật sư ID ${lawyer_id} cho vụ án ID ${caseId}`
    });
    
    return res.status(200).json({
      success: true,
      data: updatedCase,
      message: 'Gán luật sư thành công'
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
    const { parameters, lawyer_id } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quyền (chỉ luật sư được gán cho vụ án mới được tính phí)
    const legalCase = await legalCaseModel.getLegalCaseById(caseId);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    // Kiểm tra xem người dùng có phải là luật sư được gán cho vụ án không
    if (legalCase.lawyer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tính phí cho vụ án này'
      });
    }
    
    // Tính phí dựa trên loại vụ án và tham số
    const feeDetails = await legalCaseModel.calculateFee(legalCase.case_type, parameters);
    
    // Cập nhật thông tin phí vào vụ án
    const updatedCase = await legalCaseModel.updateFeeInfo(caseId, feeDetails);
    
    // Cập nhật trạng thái vụ án thành "đang xử lý" sau khi tính phí
    await legalCaseModel.updateCaseStatus(caseId, 'in_progress');
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId,
      action: 'CALCULATE_FEE',
      tableName: 'LegalCases',
      recordId: caseId,
      details: `Tính phí vụ án ID ${caseId}, số tiền ${feeDetails.total_fee}`
    });
    
    return res.status(200).json({
      success: true,
      data: {
        case: updatedCase,
        fee_details: feeDetails
      },
      message: 'Tính phí vụ án thành công'
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
    
    // Nếu thanh toán thành công, cập nhật trạng thái vụ án thành 'paid'
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
    const { title, description, case_type, ai_content, is_ai_generated } = req.body;
    const userId = req.user.id;
    
    console.log('[BACKEND] Nhận request cập nhật vụ án:', {
      case_id: caseId,
      title,
      case_type,
      has_description: !!description,
      has_ai_content: !!ai_content,
      is_ai_generated: is_ai_generated === 'true',
      has_file: !!req.file
    });
    
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
    
    // Cập nhật nội dung AI nếu có
    if (ai_content) {
      console.log('[BACKEND] Cập nhật nội dung AI, độ dài:', ai_content.length);
      updateData.ai_content = ai_content;
      
      // Cập nhật trạng thái is_ai_generated dựa trên tham số hoặc giữ nguyên giá trị cũ
      updateData.is_ai_generated = is_ai_generated === 'true' ? true : 
                                  (is_ai_generated === 'false' ? false : 
                                  legalCase.is_ai_generated);
    }
    
    // Xử lý nếu có file upload mới
    if (req.file) {
      // Tạo đường dẫn file mới để lưu vào DB
      const fileUrl = `/uploads/legal-cases/${req.file.filename}`;
      updateData.file_url = fileUrl;
      console.log('[BACKEND] Đã lưu file mới tại:', fileUrl);
      
      // Xóa file cũ nếu tồn tại
      if (legalCase.file_url) {
        const oldFilePath = path.join(__dirname, '../../', legalCase.file_url);
        try {
          // Kiểm tra file tồn tại trước khi xóa
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log('[BACKEND] Đã xóa file cũ:', legalCase.file_url);
        } catch (error) {
          console.error('[BACKEND] Không thể xóa file cũ:', error);
          // Không ném lỗi, vẫn tiếp tục cập nhật
        }
      }
    }
    
    console.log('[BACKEND] Dữ liệu cập nhật:', updateData);
    
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
    console.error('[BACKEND] Lỗi khi cập nhật vụ án:', error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('[BACKEND] Lỗi khi xóa file tạm thời:', unlinkError);
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

// Trích xuất nội dung từ file tải lên
exports.extractFileContent = asyncHandler(async (req, res) => {
  try {
    console.log('[BACKEND][EXTRACT] Bắt đầu trích xuất nội dung từ file');
    
    if (!req.file) {
      console.log('[BACKEND][EXTRACT] Không tìm thấy file');
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy file được tải lên'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(filePath).toLowerCase();
    let extractedContent = '';
    
    console.log('[BACKEND][EXTRACT] Xử lý file:', {
      path: filePath,
      extension: fileExtension,
      size: (await fs.stat(filePath)).size + ' bytes'
    });
    
    // Trích xuất nội dung dựa vào định dạng file
    if (fileExtension === '.txt') {
      // Đọc trực tiếp file text
      extractedContent = await fs.readFile(filePath, 'utf8');
      console.log('[BACKEND][EXTRACT] Đã đọc nội dung text, độ dài:', extractedContent.length);
    } else if (fileExtension === '.pdf') {
      // Sử dụng pdf-parse hoặc thư viện tương tự để đọc PDF
      try {
        console.log('[BACKEND][EXTRACT] Đang xử lý file PDF');
        const pdfParse = require('pdf-parse');
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(dataBuffer);
        extractedContent = pdfData.text;
        console.log('[BACKEND][EXTRACT] Đã trích xuất nội dung PDF, độ dài:', extractedContent.length);
      } catch (pdfError) {
        console.error('[BACKEND][EXTRACT] Lỗi khi đọc file PDF:', pdfError);
        return res.status(400).json({
          success: false,
          message: 'Không thể đọc nội dung file PDF: ' + pdfError.message
        });
      }
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      // Sử dụng mammoth hoặc thư viện tương tự để đọc DOCX
      try {
        console.log('[BACKEND][EXTRACT] Đang xử lý file DOCX/DOC');
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        extractedContent = result.value;
        console.log('[BACKEND][EXTRACT] Đã trích xuất nội dung DOCX/DOC, độ dài:', extractedContent.length);
      } catch (docError) {
        console.error('[BACKEND][EXTRACT] Lỗi khi đọc file DOC/DOCX:', docError);
        return res.status(400).json({
          success: false,
          message: 'Không thể đọc nội dung file DOC/DOCX: ' + docError.message
        });
      }
    } else {
      console.log('[BACKEND][EXTRACT] Định dạng file không được hỗ trợ:', fileExtension);
      return res.status(400).json({
        success: false,
        message: 'Định dạng file không được hỗ trợ'
      });
    }

    // Kiểm tra nội dung trích xuất có trống không
    if (!extractedContent || extractedContent.trim() === '') {
      console.log('[BACKEND][EXTRACT] Nội dung trích xuất trống');
      return res.status(400).json({
        success: false,
        message: 'Không thể trích xuất nội dung từ file. File có thể trống hoặc bị lỗi.'
      });
    }

    console.log('[BACKEND][EXTRACT] Trích xuất thành công, trả về nội dung, độ dài:', extractedContent.length);
    
    // Trả về nội dung đã trích xuất
    return res.status(200).json({
      success: true,
      data: {
        content: extractedContent,
        fileType: fileExtension,
        contentLength: extractedContent.length
      }
    });
    
  } catch (error) {
    console.error('[BACKEND][EXTRACT] Lỗi khi trích xuất nội dung file:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi trích xuất nội dung file: ' + error.message
    });
  }
});

/**
 * @desc    Lấy tài khoản ngân hàng mặc định của luật sư
 * @route   GET /api/legal-cases/lawyers/:id/bank-account
 * @access  Private
 */
exports.getLawyerBankAccount = asyncHandler(async (req, res) => {
  try {
    const lawyerId = req.params.id;
    
    // Lấy tài khoản ngân hàng mặc định của luật sư
    const query = `
      SELECT * FROM BankAccounts
      WHERE user_id = $1 AND status = 'active' AND is_default = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [lawyerId]);
    
    if (result.rows.length === 0) {
      // Nếu không có tài khoản mặc định, lấy tài khoản đầu tiên
      const fallbackQuery = `
        SELECT * FROM BankAccounts
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const fallbackResult = await pool.query(fallbackQuery, [lawyerId]);
      
      if (fallbackResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản ngân hàng'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: fallbackResult.rows[0]
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy tài khoản ngân hàng của luật sư:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tài khoản ngân hàng của luật sư'
    });
  }
}); 