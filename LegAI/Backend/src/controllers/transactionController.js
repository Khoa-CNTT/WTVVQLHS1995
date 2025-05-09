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
    
    if (!lawyerId) {
      return res.status(400).json({
        success: false,
        message: 'ID luật sư không hợp lệ'
      });
    }
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      startDate,
      endDate
    };
    
    try {
      const transactions = await transactionModel.getTransactionsByLawyer(lawyerId, options);
      
      // Đảm bảo cấu trúc dữ liệu trả về luôn đúng định dạng
      const responseData = {
        transactions: Array.isArray(transactions.transactions) ? transactions.transactions : [],
        total: typeof transactions.total === 'number' ? transactions.total : 0,
        page: options.page,
        limit: options.limit,
        totalPages: typeof transactions.totalPages === 'number' ? transactions.totalPages : 0
      };
      
      return res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (modelError) {
      console.error('Lỗi từ transactionModel.getTransactionsByLawyer:', modelError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu từ cơ sở dữ liệu',
        data: {
          transactions: [],
          total: 0,
          page: options.page,
          limit: options.limit,
          totalPages: 0
        }
      });
    }
  } catch (error) {
    console.error('Lỗi tổng thể khi lấy danh sách giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch',
      data: {
        transactions: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
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
    
    // Kiểm tra ID giao dịch trước khi gọi model
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null' || transactionId === 'all') {
      return res.status(400).json({
        success: false,
        message: `ID giao dịch không hợp lệ: ${transactionId}`
      });
    }
    
    // Kiểm tra ID là số nguyên hợp lệ
    const transactionIdInt = parseInt(transactionId, 10);
    if (isNaN(transactionIdInt)) {
      return res.status(400).json({
        success: false,
        message: `ID giao dịch không phải là số hợp lệ: ${transactionId}`
      });
    }
    
    const transaction = await transactionModel.getTransactionById(transactionIdInt);
    
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
      message: error.message || 'Lỗi khi lấy chi tiết giao dịch'
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
 * @route     PATCH /api/transactions/:id/confirm
 * @access    Private (Lawyer)
 */
exports.confirmPayment = asyncHandler(async (req, res) => {
  try {
    const transactionId = req.params.id;
    const lawyerId = req.user.id;
    const { notes, update_case_status, case_id, update_status } = req.body;
    
    // Kiểm tra quyền
    if (req.user.role.toLowerCase() !== 'lawyer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ luật sư mới có quyền xác nhận thanh toán'
      });
    }
    
    // Kiểm tra giao dịch
    const transactionQuery = `SELECT * FROM Transactions WHERE id = $1`;
    const transactionResult = await pool.query(transactionQuery, [transactionId]);
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    
    const transaction = transactionResult.rows[0];
    const transactionCaseId = transaction.case_id;
    
    // Cập nhật trạng thái giao dịch thành completed
    const updateQuery = `
      UPDATE Transactions
      SET 
        status = 'completed', 
        updated_at = NOW(),
        confirmation_date = NOW(),
        confirmation_notes = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [notes || '', transactionId]);
    const updatedTransaction = updateResult.rows[0];
    
    // Cập nhật trạng thái vụ án sang paid nếu có
    if ((update_case_status || update_status) && transactionCaseId) {
      try {
        await pool.query(`
          UPDATE LegalCases
          SET status = 'paid', updated_at = NOW()
          WHERE id = $1
        `, [transactionCaseId]);
        
        console.log(`Đã cập nhật trạng thái vụ án ID ${transactionCaseId} thành 'paid'`);
      } catch (caseUpdateError) {
        console.error('Lỗi khi cập nhật trạng thái vụ án:', caseUpdateError);
      }
    }
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: lawyerId,
      action: 'CONFIRM_PAYMENT',
      tableName: 'Transactions',
      recordId: transactionId,
      details: `Luật sư xác nhận thanh toán cho giao dịch ID ${transactionId}`
    });
    
    return res.status(200).json({
      success: true,
      data: updatedTransaction,
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
    
    console.log('Nhận yêu cầu tạo giao dịch thanh toán:', {
      case_id,
      payment_method,
      amount,
      user_id,
      fee_details: fee_details ? 'có' : 'không có',
      description: description || '(không có)'
    });

    // Kiểm tra đầy đủ thông tin
    if (!case_id) {
      console.error('Thiếu thông tin case_id');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID vụ án'
      });
    }
    
    if (!payment_method) {
      console.error('Thiếu thông tin payment_method');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp phương thức thanh toán'
      });
    }
    
    // Kiểm tra vụ án tồn tại
    console.log('Kiểm tra vụ án tồn tại với ID:', case_id);
    const legalCase = await legalCaseModel.getLegalCaseById(case_id);
    
    if (!legalCase) {
      console.error('Không tìm thấy vụ án với ID:', case_id);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vụ án'
      });
    }
    
    // Lấy số tiền từ vụ án nếu không được cung cấp
    let transaction_amount = amount;
    if (!transaction_amount || transaction_amount <= 0) {
      if (legalCase.fee_amount && parseFloat(legalCase.fee_amount) > 0) {
        transaction_amount = parseFloat(legalCase.fee_amount);
        console.log(`Không có thông tin số tiền hợp lệ, sử dụng fee_amount từ vụ án: ${transaction_amount}`);
      } else {
        console.error('Không có thông tin số tiền và vụ án không có fee_amount hợp lệ');
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp số tiền thanh toán hợp lệ hoặc tính phí cho vụ án trước'
        });
      }
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
      amount: transaction_amount,
      payment_method,
      status: 'pending',
      description: description || `Thanh toán cho vụ án: ${legalCase.title}`,
      fee_details: processedFeeDetails,
      payment_provider
    };
    
    console.log('Dữ liệu giao dịch sẽ được lưu:', transactionData);
    
    const transaction = await transactionModel.createTransaction(transactionData);
    console.log('Đã tạo giao dịch thành công với ID:', transaction.id);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: user_id,
      action: 'CREATE_TRANSACTION',
      tableName: 'Transactions',
      recordId: transaction.id,
      details: `Tạo giao dịch thanh toán cho vụ án ID ${case_id}, số tiền ${transaction_amount}`
    });
    
    // Tạo URL thanh toán (mô phỏng)
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment?transaction_id=${transaction.id}&amount=${transaction_amount}`;
    
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

/**
 * @desc      Lấy tất cả giao dịch (dành cho Admin)
 * @route     GET /api/transactions/all
 * @access    Private/Admin
 */
exports.getAllTransactions = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, search, sort_by, sort_order } = req.query;
    
    // Tạo query
    let query = `
      SELECT t.id, t.user_id, t.lawyer_id, t.case_id, t.amount, t.status, t.payment_method,
        t.payment_details, t.transaction_code, t.confirmation_date, t.confirmation_notes,
        t.created_at, t.updated_at,
        u.username AS user_name, u.full_name AS customer_name,
        l.username AS lawyer_username, l.full_name AS lawyer_name,
        c.title AS case_title
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN Users l ON t.lawyer_id = l.id
      LEFT JOIN LegalCases c ON t.case_id = c.id
      WHERE 1=1
    `;
    
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.id
      LEFT JOIN Users l ON t.lawyer_id = l.id
      LEFT JOIN LegalCases c ON t.case_id = c.id
      WHERE 1=1
    `;
    
    // Xây dựng điều kiện tìm kiếm
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`t.status = $${paramIndex++}`);
      values.push(status);
    }
    
    if (startDate) {
      // Nếu startDate chỉ là ngày (không có giờ), thêm thời gian bắt đầu của ngày
      const formattedStartDate = startDate.includes('T') 
        ? startDate 
        : `${startDate}T00:00:00.000Z`;
        
      conditions.push(`t.created_at >= $${paramIndex++}`);
      values.push(formattedStartDate);
    }
    
    if (endDate) {
      // Nếu endDate chỉ là ngày (không có giờ), thêm thời gian kết thúc của ngày
      const formattedEndDate = endDate.includes('T') 
        ? endDate 
        : `${endDate}T23:59:59.999Z`;
        
      conditions.push(`t.created_at <= $${paramIndex++}`);
      values.push(formattedEndDate);
    }
    
    if (search) {
      conditions.push(`(
        u.full_name ILIKE $${paramIndex} OR
        l.full_name ILIKE $${paramIndex} OR
        c.title ILIKE $${paramIndex} OR
        t.transaction_code ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    // Thêm điều kiện vào query
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    // Thêm sắp xếp
    query += ` ORDER BY t.${sort_by || 'created_at'} ${sort_order || 'DESC'}`;
    
    // Thêm phân trang
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    console.log('SQL Query:', query);
    console.log('SQL Params:', values);
    
    // Thực hiện truy vấn
    const result = await pool.query(query, values);
    const countResult = await pool.query(countQuery, values.slice(0, values.length - 2));
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      data: result.rows
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy tất cả giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tất cả giao dịch'
    });
  }
});

/**
 * @desc      Lấy danh sách phí pháp lý
 * @route     GET /api/transactions/fee-references
 * @access    Private/Admin
 */
exports.getFeeReferences = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT * FROM FeeReferences
      ORDER BY case_type ASC
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phí pháp lý:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phí pháp lý'
    });
  }
});

/**
 * @desc      Tạo mới phí pháp lý
 * @route     POST /api/transactions/fee-references
 * @access    Private/Admin
 */
exports.createFeeReference = asyncHandler(async (req, res) => {
  try {
    const {
      case_type,
      description,
      base_fee,
      percentage_fee,
      calculation_method,
      min_fee,
      max_fee
    } = req.body;
    
    // Kiểm tra thông tin bắt buộc
    if (!case_type || !description || base_fee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: loại vụ án, mô tả và phí cơ bản'
      });
    }
    
    // Kiểm tra xem case_type đã tồn tại chưa
    const checkQuery = 'SELECT * FROM FeeReferences WHERE case_type = $1';
    const checkResult = await pool.query(checkQuery, [case_type]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Loại vụ án này đã tồn tại trong bảng phí'
      });
    }
    
    const query = `
      INSERT INTO FeeReferences (
        case_type,
        description,
        base_fee,
        percentage_fee,
        calculation_method,
        min_fee,
        max_fee,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      case_type,
      description,
      base_fee,
      percentage_fee || 0,
      calculation_method || 'fixed',
      min_fee || base_fee,
      max_fee || null
    ];
    
    const result = await pool.query(query, values);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: req.user.id,
      action: 'CREATE_FEE_REFERENCE',
      tableName: 'FeeReferences',
      recordId: result.rows[0].id,
      details: `Tạo mới phí pháp lý cho loại vụ án: ${case_type}`
    });
    
    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi tạo mới phí pháp lý:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo mới phí pháp lý'
    });
  }
});

/**
 * @desc      Cập nhật phí pháp lý
 * @route     PUT /api/transactions/fee-references/:id
 * @access    Private/Admin
 */
exports.updateFeeReference = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      case_type,
      description,
      base_fee,
      percentage_fee,
      calculation_method,
      min_fee,
      max_fee
    } = req.body;
    
    // Kiểm tra phí pháp lý tồn tại
    const checkQuery = 'SELECT * FROM FeeReferences WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phí pháp lý'
      });
    }
    
    // Nếu cập nhật case_type, kiểm tra case_type mới đã tồn tại chưa
    if (case_type && case_type !== checkResult.rows[0].case_type) {
      const duplicateCheck = 'SELECT * FROM FeeReferences WHERE case_type = $1 AND id != $2';
      const duplicateResult = await pool.query(duplicateCheck, [case_type, id]);
      
      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Loại vụ án này đã tồn tại trong bảng phí'
        });
      }
    }
    
    // Chuẩn bị câu lệnh cập nhật
    let updateQuery = 'UPDATE FeeReferences SET updated_at = NOW()';
    const values = [];
    let paramIndex = 1;
    
    if (case_type) {
      updateQuery += `, case_type = $${paramIndex++}`;
      values.push(case_type);
    }
    
    if (description) {
      updateQuery += `, description = $${paramIndex++}`;
      values.push(description);
    }
    
    if (base_fee !== undefined) {
      updateQuery += `, base_fee = $${paramIndex++}`;
      values.push(base_fee);
    }
    
    if (percentage_fee !== undefined) {
      updateQuery += `, percentage_fee = $${paramIndex++}`;
      values.push(percentage_fee);
    }
    
    if (calculation_method) {
      updateQuery += `, calculation_method = $${paramIndex++}`;
      values.push(calculation_method);
    }
    
    if (min_fee !== undefined) {
      updateQuery += `, min_fee = $${paramIndex++}`;
      values.push(min_fee);
    }
    
    if (max_fee !== undefined) {
      updateQuery += `, max_fee = $${paramIndex++}`;
      values.push(max_fee);
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    // Thực hiện cập nhật
    const result = await pool.query(updateQuery, values);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: req.user.id,
      action: 'UPDATE_FEE_REFERENCE',
      tableName: 'FeeReferences',
      recordId: id,
      details: `Cập nhật phí pháp lý ID: ${id}`
    });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật phí pháp lý:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phí pháp lý'
    });
  }
});

/**
 * @desc      Xóa phí pháp lý
 * @route     DELETE /api/transactions/fee-references/:id
 * @access    Private/Admin
 */
exports.deleteFeeReference = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra phí pháp lý tồn tại
    const checkQuery = 'SELECT * FROM FeeReferences WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phí pháp lý'
      });
    }
    
    // Xóa phí pháp lý
    const deleteQuery = 'DELETE FROM FeeReferences WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);
    
    // Ghi log
    await auditLogModel.addAuditLog({
      userId: req.user.id,
      action: 'DELETE_FEE_REFERENCE',
      tableName: 'FeeReferences',
      recordId: id,
      details: `Xóa phí pháp lý cho loại vụ án: ${checkResult.rows[0].case_type}`
    });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Xóa phí pháp lý thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa phí pháp lý:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phí pháp lý'
    });
  }
}); 