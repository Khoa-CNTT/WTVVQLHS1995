const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const transactionModel = require('../models/transactionModel');
const legalCaseModel = require('../models/legalCaseModel');
const auditLogModel = require('../models/auditLogModel');
const emailService = require('../services/emailService');
const pool = require('../config/database'); // Assuming you have a database connection pool

/**
 * @desc      Lấy danh sách giao dịch của luật sư
 * @route     GET /api/transactions/lawyer
 * @access    Private (Lawyer)
 */
exports.getLawyerTransactions = asyncHandler(async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { page, limit, status, startDate, endDate } = req.query;
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      startDate,
      endDate
    };
    
    const transactions = await transactionModel.getTransactionsByLawyer(lawyerId, options);
    
    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch'
    });
  }
});

/**
 * @desc      Lấy chi tiết giao dịch
 * @route     GET /api/transactions/:id
 * @access    Private
 */
exports.getTransactionById = asyncHandler(async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;
    
    const transaction = await transactionModel.getTransactionById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    
    // Kiểm tra quyền truy cập (chỉ luật sư hoặc khách hàng liên quan đến giao dịch)
    const isLawyer = transaction.lawyer_id === userId;
    const isCustomer = transaction.user_id === userId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    
    if (!isLawyer && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập giao dịch này'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết giao dịch'
    });
  }
});

/**
 * @desc      Lấy thống kê tài chính của luật sư
 * @route     GET /api/transactions/lawyer/stats
 * @access    Private (Lawyer)
 */
exports.getLawyerFinancialStats = asyncHandler(async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { startDate, endDate } = req.query;
    
    const stats = await transactionModel.getLawyerFinancialStats(lawyerId, {
      startDate,
      endDate
    });
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê tài chính:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê tài chính'
    });
  }
});

/**
 * @desc      Xác nhận thanh toán bởi luật sư
 * @route     POST /api/transactions/:id/confirm
 * @access    Private (Lawyer)
 */
exports.confirmPayment = asyncHandler(async (req, res) => {
  try {
    const transactionId = req.params.id;
    const lawyerId = req.user.id;
    const { notes, updateCaseStatus } = req.body;
    
    // Kiểm tra quyền
    if (req.user.role.toLowerCase() !== 'lawyer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ luật sư mới có quyền xác nhận thanh toán'
      });
    }
    
    const transaction = await transactionModel.confirmPaymentByLawyer(
      transactionId,
      lawyerId,
      { notes, updateCaseStatus }
    );
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: lawyerId,
      action: 'CONFIRM_PAYMENT',
      tableName: 'Transactions',
      recordId: transactionId,
      details: `Luật sư xác nhận thanh toán cho giao dịch ID ${transactionId}`
    });
    
    // Gửi email thông báo cho khách hàng
    if (transaction.user_email) {
      try {
        await emailService.sendEmail({
          to: transaction.user_email,
          subject: 'Thanh toán đã được xác nhận',
          text: `Luật sư đã xác nhận thanh toán cho vụ án của bạn. Mã giao dịch: ${transactionId}.`
        });
      } catch (emailError) {
        console.error('Lỗi khi gửi email thông báo xác nhận thanh toán:', emailError);
      }
    }
    
    return res.status(200).json({
      success: true,
      data: transaction,
      message: 'Xác nhận thanh toán thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xác nhận thanh toán'
    });
  }
});

/**
 * @desc      Tạo giao dịch thanh toán mới
 * @route     POST /api/transactions
 * @access    Private
 */
exports.createTransaction = asyncHandler(async (req, res) => {
  try {
    const {
      case_id,
      payment_method,
      amount,
      description,
      lawyer_id,
      fee_details,
      payment_provider
    } = req.body;
    
    const user_id = req.user.id;
    
    if (!case_id || !payment_method || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin giao dịch'
      });
    }
    
    // Kiểm tra vụ án tồn tại
    const legalCase = await legalCaseModel.getLegalCaseById(case_id);
    
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    // Xử lý fee_details
    let processedFeeDetails = fee_details;
    if (fee_details) {
      // Nếu fee_details là string, kiểm tra xem có phải JSON hợp lệ không
      if (typeof fee_details === 'string') {
        try {
          // Thử parse để kiểm tra
          JSON.parse(fee_details);
          // Nếu thành công, giữ nguyên dạng string
          processedFeeDetails = fee_details;
        } catch (error) {
          // Nếu không phải JSON hợp lệ, chuyển thành null
          console.error(`Fee details không phải JSON hợp lệ: ${fee_details}`);
          processedFeeDetails = null;
        }
      } else if (typeof fee_details === 'object') {
        // Nếu là object, chuyển thành JSON string
        try {
          processedFeeDetails = JSON.stringify(fee_details);
        } catch (error) {
          console.error('Lỗi khi chuyển fee_details thành JSON:', error);
          processedFeeDetails = null;
        }
      } else {
        // Các trường hợp khác, gán null
        processedFeeDetails = null;
      }
    }
    
    // Tạo giao dịch
    const transactionData = {
      user_id,
      lawyer_id: lawyer_id || legalCase.lawyer_id,
      case_id,
      amount,
      payment_method,
      status: 'pending',
      description: description || `Thanh toán cho vụ án: ${legalCase.title}`,
      fee_details: processedFeeDetails,
      payment_provider
    };
    
    const transaction = await transactionModel.createTransaction(transactionData);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: user_id,
      action: 'CREATE_TRANSACTION',
      tableName: 'Transactions',
      recordId: transaction.id,
      details: `Tạo giao dịch thanh toán cho vụ án ID ${case_id}, số tiền ${amount}`
    });
    
    // Tạo URL thanh toán (mô phỏng)
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment?transaction_id=${transaction.id}&amount=${amount}`;
    
    return res.status(201).json({
      success: true,
      data: {
        id: transaction.id,
        transaction_id: transaction.id,
        payment_url: paymentUrl,
        amount: transaction.amount
      },
      message: 'Tạo giao dịch thanh toán thành công'
    });
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo giao dịch thanh toán'
    });
  }
});

/**
 * @desc      Webhook cập nhật trạng thái giao dịch từ cổng thanh toán
 * @route     POST /api/transactions/webhook
 * @access    Public
 */
exports.paymentWebhook = asyncHandler(async (req, res) => {
  try {
    const { transaction_id, status, payment_info } = req.body;
    
    if (!transaction_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết'
      });
    }
    
    const transaction = await transactionModel.getTransactionById(transaction_id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    
    // Cập nhật trạng thái giao dịch
    const updatedTransaction = await transactionModel.updateTransactionStatus(
      transaction_id,
      status,
      payment_info
    );
    
    // Nếu thanh toán thành công, cập nhật trạng thái vụ án
    if (status === 'completed') {
      await legalCaseModel.updateCaseStatus(transaction.case_id, 'paid');
      
      // Gửi email thông báo cho khách hàng
      if (transaction.user_email) {
        try {
          await emailService.sendEmail({
            to: transaction.user_email,
            subject: 'Thanh toán thành công',
            text: `Cảm ơn bạn đã thanh toán cho vụ án. Mã giao dịch: ${transaction_id}. Số tiền: ${transaction.amount}`
          });
        } catch (emailError) {
          console.error('Lỗi khi gửi email thông báo thanh toán thành công:', emailError);
        }
      }
      
      // Gửi email thông báo cho luật sư
      if (transaction.lawyer_email) {
        try {
          await emailService.sendEmail({
            to: transaction.lawyer_email,
            subject: 'Có thanh toán mới',
            text: `Khách hàng đã thanh toán cho vụ án. Mã giao dịch: ${transaction_id}. Số tiền: ${transaction.amount}`
          });
        } catch (emailError) {
          console.error('Lỗi khi gửi email thông báo cho luật sư:', emailError);
        }
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

/**
 * @desc      Cập nhật trạng thái giao dịch
 * @route     PATCH /api/transactions/:id/status
 * @access    Private
 */
exports.updateTransactionStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_method, transaction_code, payment_details } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra các trạng thái hợp lệ
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Kiểm tra giao dịch tồn tại
    const checkQuery = `
      SELECT t.*, u.id as user_id, lc.id as case_id
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN LegalCases lc ON t.case_id = lc.id
      WHERE t.id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    
    const transaction = checkResult.rows[0];
    
    // Kiểm tra quyền (admin, người dùng sở hữu giao dịch, hoặc luật sư liên quan)
    const isAdmin = req.user.role === 'admin';
    const isOwner = transaction.user_id === userId;
    const isLawyer = req.user.role === 'lawyer' && transaction.lawyer_id === userId;
    
    if (!isAdmin && !isOwner && !isLawyer) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật giao dịch này'
      });
    }
    
    // Cập nhật trạng thái giao dịch
    let updateQuery = `
      UPDATE Transactions
      SET 
        status = $1,
        updated_at = NOW()
    `;
    
    const values = [status];
    let valueIndex = 2;
    
    // Thêm các trường khác nếu có
    if (payment_method) {
      updateQuery += `, payment_method = $${valueIndex}`;
      values.push(payment_method);
      valueIndex++;
    }
    
    if (transaction_code) {
      updateQuery += `, transaction_code = $${valueIndex}`;
      values.push(transaction_code);
      valueIndex++;
    }
    
    if (payment_details) {
      updateQuery += `, payment_details = $${valueIndex}`;
      values.push(JSON.stringify(payment_details));
      valueIndex++;
    }
    
    updateQuery += `
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    values.push(id);
    
    const updateResult = await pool.query(updateQuery, values);
    
    // Cập nhật trạng thái hoàn thành cho vụ án nếu giao dịch hoàn thành
    if (status === 'completed' && transaction.case_id) {
      try {
        await pool.query(`
          UPDATE LegalCases
          SET status = 'paid'
          WHERE id = $1
        `, [transaction.case_id]);
      } catch (caseUpdateError) {
        console.error('Lỗi khi cập nhật trạng thái vụ án:', caseUpdateError);
      }
    }
    
    // Thêm vào bảng audit log
    try {
      await auditLogModel.createLog({
        user_id: req.user.id,
        action: `update_transaction_status_${status}`,
        entity_type: 'transaction',
        entity_id: id,
        description: `Cập nhật trạng thái giao dịch #${id} thành ${status}`,
        old_data: JSON.stringify({ status: transaction.status }),
        new_data: JSON.stringify({ status })
      });
    } catch (logError) {
      console.error('Lỗi khi tạo audit log:', logError);
    }
    
    return res.status(200).json({
      success: true,
      data: updateResult.rows[0],
      message: 'Cập nhật trạng thái giao dịch thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái giao dịch'
    });
  }
}); 