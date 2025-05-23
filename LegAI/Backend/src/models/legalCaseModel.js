const pool = require('../config/database');
const fs = require('fs').promises;

/**
 * Tạo vụ án pháp lý mới
 * @param {Object} caseData - Dữ liệu vụ án
 * @returns {Promise<Object>} Vụ án đã được tạo
 */
const createLegalCase = async (caseData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Tạo vụ án mới
    const caseQuery = `
      INSERT INTO LegalCases (
        user_id, title, description, case_type, status, 
        ai_content, is_ai_generated, file_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, title, description, case_type, status, 
        ai_content, is_ai_generated, file_url, created_at, updated_at
    `;
    
    const caseValues = [
      caseData.user_id,
      caseData.title,
      caseData.description,
      caseData.case_type,
      caseData.status || 'draft',
      caseData.ai_content || null,
      caseData.is_ai_generated || false,
      caseData.file_url || null
    ];
    
    const caseResult = await client.query(caseQuery, caseValues);
    const newCase = caseResult.rows[0];
    
    await client.query('COMMIT');
    return newCase;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi tạo vụ án:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Lấy danh sách vụ án của người dùng
 * @param {number} userId - ID người dùng
 * @param {Object} options - Tùy chọn: page, limit, status
 * @returns {Promise<Array>} Danh sách vụ án
 */
const getLegalCasesByUserId = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.id, c.user_id, c.title, c.description, c.case_type, c.status,
        c.lawyer_id, c.fee_amount, c.is_ai_generated, c.file_url, c.created_at, c.updated_at,
        u.username AS user_name,
        CASE WHEN l.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', l.id,
            'username', l.username,
            'full_name', l.full_name
          )
        END AS lawyer
      FROM LegalCases c
      LEFT JOIN Users u ON c.user_id = u.id
      LEFT JOIN Users l ON c.lawyer_id = l.id
      WHERE c.user_id = $1 AND c.deleted_at IS NULL
    `;
    
    const values = [userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      values.push(status);
    }
    
    query += `
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án:', error);
    throw error;
  }
};

/**
 * Lấy danh sách vụ án của luật sư
 * @param {number} lawyerId - ID luật sư
 * @param {Object} options - Tùy chọn: page, limit, status
 * @returns {Promise<Array>} Danh sách vụ án
 */
const getLegalCasesByLawyerId = async (lawyerId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.id, c.user_id, c.title, c.description, c.case_type, c.status,
        c.lawyer_id, c.fee_amount, c.is_ai_generated, c.file_url, c.created_at, c.updated_at,
        u.username AS user_name,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        CASE WHEN l.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', l.id,
            'username', l.username,
            'full_name', l.full_name
          )
        END AS lawyer
      FROM LegalCases c
      LEFT JOIN Users u ON c.user_id = u.id
      LEFT JOIN Users l ON c.lawyer_id = l.id
      WHERE c.lawyer_id = $1 AND c.deleted_at IS NULL
    `;
    
    const values = [lawyerId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      values.push(status);
    }
    
    query += `
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vụ án của luật sư:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết vụ án theo ID
 * @param {number} caseId - ID vụ án
 * @returns {Promise<Object>} Chi tiết vụ án
 */
const getLegalCaseById = async (caseId) => {
  try {
    // Kiểm tra và chuyển đổi ID sang số nguyên
    const caseIdInt = parseInt(caseId, 10);
    
    // Nếu không thể chuyển đổi thành số nguyên hợp lệ
    if (isNaN(caseIdInt)) {
      throw new Error(`ID vụ án không hợp lệ: ${caseId}`);
    }
    
    const query = `
      SELECT c.id, c.user_id, c.title, c.description, c.case_type, c.status,
        c.lawyer_id, c.fee_amount, c.fee_details, c.ai_content, c.is_ai_generated, 
        c.notes, c.file_url, c.created_at, c.updated_at,
        u.username AS user_name,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        CASE WHEN l.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', l.id,
            'username', l.username,
            'full_name', l.full_name,
            'email', l.email,
            'phone', l.phone
          )
        END AS lawyer
      FROM LegalCases c
      LEFT JOIN Users u ON c.user_id = u.id
      LEFT JOIN Users l ON c.lawyer_id = l.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [caseIdInt]);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy vụ án');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết vụ án ID ${caseId}:`, error);
    throw error;
  }
};

/**
 * Gán luật sư cho vụ án
 * @param {number} caseId - ID vụ án
 * @param {number} lawyerId - ID luật sư
 * @returns {Promise<Object>} Vụ án đã cập nhật
 */
const assignLawyer = async (caseId, lawyerId) => {
  try {
    const query = `
      UPDATE LegalCases
      SET lawyer_id = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, user_id, lawyer_id, status
    `;
    
    const result = await pool.query(query, [lawyerId, caseId]);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy vụ án');
    }
    
    return await getLegalCaseById(caseId);
  } catch (error) {
    console.error('Lỗi khi gán luật sư cho vụ án:', error);
    throw error;
  }
};

/**
 * Tạo lịch hẹn từ vụ án
 * @param {Object} appointmentData - Dữ liệu lịch hẹn
 * @returns {Promise<Object>} Lịch hẹn đã tạo
 */
const createAppointment = async (appointmentData) => {
  try {
    // Kiểm tra các trường bắt buộc
    if (!appointmentData.customer_id || !appointmentData.lawyer_id) {
      throw new Error('Thiếu thông tin khách hàng hoặc luật sư');
    }
    
    // Kiểm tra và thiết lập thời gian mặc định nếu cần
    if (!appointmentData.start_time || !appointmentData.end_time) {
      const now = new Date();
      const startTime = appointmentData.start_time ? new Date(appointmentData.start_time) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endTime = appointmentData.end_time ? new Date(appointmentData.end_time) : new Date(startTime.getTime() + 60 * 60 * 1000);
      
      appointmentData.start_time = startTime.toISOString();
      appointmentData.end_time = endTime.toISOString();
    }
    
    // Chuẩn bị câu lệnh SQL với đầy đủ các trường
    const query = `
      INSERT INTO Appointments (
        customer_id, lawyer_id, case_id, status, notes, appointment_type,
        start_time, end_time, purpose
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, customer_id, lawyer_id, case_id, status, notes, 
        appointment_type, start_time, end_time, created_at
    `;
    
    const values = [
      appointmentData.customer_id,
      appointmentData.lawyer_id,
      appointmentData.case_id,
      appointmentData.status || 'pending',
      appointmentData.notes || '',
      appointmentData.appointment_type || 'case_consultation',
      appointmentData.start_time,
      appointmentData.end_time,
      appointmentData.purpose || 'Tư vấn pháp lý'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    throw error;
  }
};

/**
 * Tính phí vụ án dựa trên loại vụ án
 * @param {string} caseType - Loại vụ án
 * @param {Object} parameters - Tham số tính phí
 * @returns {Promise<Object>} Thông tin phí
 */
const calculateFee = async (caseType, parameters = {}) => {
  try {
    console.log('Bắt đầu tính phí với thông tin:', { caseType, parameters });
    
    // Ánh xạ loại vụ án tiếng Việt sang tiếng Anh để khớp với bảng FeeReferences
    const caseTypeMapping = {
      'Dân sự': 'civil',
      'Hình sự': 'criminal',
      'Hành chính': 'administrative',
      'Lao động': 'labor',
      'Hôn nhân gia đình': 'divorce',
      'Kinh doanh thương mại': 'commercial',
      'Sở hữu trí tuệ': 'intellectual',
      'Đất đai': 'land'
    };
    
    // Chuyển đổi case_type sang mã tiếng Anh tương ứng
    const englishCaseType = caseTypeMapping[caseType] || caseType;
    
    console.log(`Ánh xạ loại vụ án từ "${caseType}" thành "${englishCaseType}"`);
    
    // Truy vấn thông tin tính phí từ database - Sửa từ FeePolicies sang FeeReferences
    const feeQuery = `
      SELECT base_fee, percentage_fee, min_fee, max_fee, calculation_method
      FROM FeeReferences
      WHERE case_type = $1
      LIMIT 1
    `;
    
    const feeResult = await pool.query(feeQuery, [englishCaseType]);
    
    // Nếu không có thông tin phí, dùng mức cơ bản
    if (feeResult.rows.length === 0) {
      console.log('Không tìm thấy chính sách phí cho loại vụ án:', englishCaseType);
      console.log('Sử dụng phí mặc định: 3,000,000 VND');
      
      // Trả về phí mặc định
      return {
        case_type: caseType,
        base_fee: 3000000,
        additional_fee: 0,
        total_fee: 3000000,
        calculation_method: 'fixed',
        parameters: parameters
      };
    }
    
    const feeInfo = feeResult.rows[0];
    console.log('Thông tin fee từ database:', feeInfo);
    
    // Đảm bảo các giá trị đều là số
    const baseFee = parseFloat(feeInfo.base_fee) || 3000000; // Đảm bảo baseFee luôn có giá trị tối thiểu
    const percentageFee = parseFloat(feeInfo.percentage_fee) || 0;
    const minFee = parseFloat(feeInfo.min_fee) || 2000000; // Đảm bảo minFee luôn có giá trị tối thiểu
    const maxFee = parseFloat(feeInfo.max_fee) || 0;
    
    console.log('Thông tin phí từ cơ sở dữ liệu (sau khi parse):', {
      baseFee, 
      percentageFee, 
      minFee, 
      maxFee, 
      calculationMethod: feeInfo.calculation_method
    });
    
    // Tính toán phí dựa trên phương thức tính
    let totalFee = baseFee;
    let additionalFee = 0;
    
    // Nếu có giá trị tranh chấp, tính thêm phần trăm
    if (parameters.dispute_value && percentageFee > 0) {
      // Chuyển đổi sang số nếu là chuỗi
      const disputeValue = typeof parameters.dispute_value === 'string' 
                         ? parseFloat(parameters.dispute_value.replace(/,/g, '')) 
                         : parseFloat(parameters.dispute_value);
                         
      if (!isNaN(disputeValue) && disputeValue > 0) {
        additionalFee = disputeValue * (percentageFee / 100);
        console.log('Tính phí bổ sung dựa trên giá trị tranh chấp:', {
          disputeValue,
          percentageFee,
          calculatedAdditionalFee: additionalFee
        });
      } else {
        console.log('Giá trị tranh chấp không hợp lệ hoặc không dương:', parameters.dispute_value);
        // Dùng giá trị mặc định cho trường hợp không hợp lệ
        const defaultDisputeValue = 1000000;
        additionalFee = defaultDisputeValue * (percentageFee / 100);
        console.log('Sử dụng giá trị tranh chấp mặc định:', {
          defaultDisputeValue,
          percentageFee,
          calculatedAdditionalFee: additionalFee
        });
      }
    }
    
    totalFee += additionalFee;
    console.log('Tổng phí sau khi cộng phí bổ sung:', totalFee);
    
    // Áp dụng giới hạn min/max
    if (minFee > 0 && totalFee < minFee) {
      console.log(`Phí ${totalFee} nhỏ hơn mức tối thiểu ${minFee}, đặt lại thành ${minFee}`);
      totalFee = minFee;
    }
    
    if (maxFee > 0 && totalFee > maxFee) {
      console.log(`Phí ${totalFee} lớn hơn mức tối đa ${maxFee}, đặt lại thành ${maxFee}`);
      totalFee = maxFee;
    }
    
    // Đảm bảo phí tối thiểu
    if (totalFee <= 0) {
      console.log('Phí tính được <= 0, đặt lại thành phí mặc định 3,000,000 VND');
      totalFee = 3000000;
    }
    
    // Làm tròn đến 1000 đồng
    totalFee = Math.ceil(totalFee / 1000) * 1000;
    
    const result = {
      case_type: caseType,
      base_fee: baseFee,
      additional_fee: additionalFee,
      total_fee: totalFee > 0 ? totalFee : 3000000, // Đảm bảo luôn trả về phí lớn hơn 0
      calculation_method: feeInfo.calculation_method,
      parameters: parameters
    };
    
    console.log('Kết quả tính phí cuối cùng:', result);
    return result;
  } catch (error) {
    console.error('Lỗi khi tính phí vụ án:', error);
    // Trả về giá trị mặc định khi có lỗi để tránh việc phí bằng 0
    return {
      case_type: caseType,
      base_fee: 3000000,
      additional_fee: 0,
      total_fee: 3000000,
      calculation_method: 'fixed',
      parameters: parameters,
      error_occurred: true
    };
  }
};

/**
 * Cập nhật thông tin phí vào vụ án
 * @param {number} caseId - ID vụ án
 * @param {Object} feeDetails - Thông tin phí
 * @returns {Promise<Object>} Vụ án đã cập nhật
 */
const updateFeeInfo = async (caseId, feeDetails) => {
  try {
    console.log('Bắt đầu cập nhật thông tin phí cho vụ án ID:', caseId);
    console.log('Chi tiết phí gốc:', feeDetails);
    
    // Kiểm tra và đảm bảo feeDetails là một object hợp lệ
    if (!feeDetails || typeof feeDetails !== 'object') {
      console.log('feeDetails không hợp lệ, tạo mới với giá trị mặc định');
      feeDetails = {
        total_fee: 3000000,
        base_fee: 3000000,
        additional_fee: 0,
        calculation_method: 'fixed'
      };
    }
    
    // Đảm bảo total_fee luôn là số lớn hơn 0
    let totalFee = typeof feeDetails.total_fee === 'string' 
      ? parseFloat(feeDetails.total_fee.replace(/[^0-9.]/g, '')) 
      : parseFloat(feeDetails.total_fee);
    
    if (isNaN(totalFee) || totalFee <= 0) {
      console.log(`Phí không hợp lệ (${feeDetails.total_fee}), đặt lại thành phí mặc định 3,000,000 VNĐ`);
      totalFee = 3000000;
      
      // Cập nhật lại giá trị trong feeDetails để đảm bảo tính nhất quán
      feeDetails.total_fee = totalFee;
    }
    
    // Đảm bảo làm tròn đến 1000 đồng
    totalFee = Math.ceil(totalFee / 1000) * 1000;
    feeDetails.total_fee = totalFee;
    
    // Kiểm tra xem phí có bị null hoặc <= 0 không để đảm bảo luôn có phí hợp lệ
    const query = `
      UPDATE LegalCases
      SET fee_amount = $1, fee_details = $2, updated_at = NOW()
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING id, fee_amount, fee_details
    `;
    
    // Chuyển đổi feeDetails thành chuỗi JSON
    const feeDetailsJson = JSON.stringify(feeDetails);
    
    const values = [
      totalFee,
      feeDetailsJson,
      caseId
    ];
    
    console.log('Thông tin cập nhật:', {
      caseId,
      totalFee,
      feeDetailsType: typeof feeDetails,
      feeDetailsJson
    });
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy vụ án');
    }
    
    console.log('Cập nhật phí thành công. Kết quả:', result.rows[0]);
    
    // Cập nhật cả trạng thái nếu cần
    try {
      // Kiểm tra trạng thái hiện tại
      const caseStatusQuery = `SELECT status FROM LegalCases WHERE id = $1`;
      const caseStatusResult = await pool.query(caseStatusQuery, [caseId]);
      
      if (caseStatusResult.rows.length > 0) {
        const currentStatus = caseStatusResult.rows[0].status;
        
        // Nếu trạng thái là 'draft', cập nhật thành 'pending' (chờ thanh toán)
        if (currentStatus === 'draft') {
          await updateCaseStatus(caseId, 'pending');
        }
      }
    } catch (statusError) {
      console.error('Lỗi khi cập nhật trạng thái vụ án:', statusError);
      // Không throw lỗi, chỉ ghi log
    }
    
    // Lấy và trả về thông tin vụ án đã cập nhật
    return await getLegalCaseById(caseId);
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin phí vụ án:', error);
    throw error;
  }
};

/**
 * Tạo giao dịch thanh toán
 * @param {Object} paymentData - Dữ liệu thanh toán
 * @returns {Promise<Object>} Giao dịch đã tạo
 */
const createPaymentTransaction = async (paymentData) => {
  try {
    const query = `
      INSERT INTO Transactions (
        user_id, lawyer_id, case_id, amount, payment_method,
        status, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, lawyer_id, case_id, amount, 
        payment_method, status, description, created_at
    `;
    
    const values = [
      paymentData.user_id,
      paymentData.lawyer_id,
      paymentData.case_id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.status || 'pending',
      paymentData.description || ''
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    throw error;
  }
};

/**
 * Lấy thông tin giao dịch
 * @param {number} transactionId - ID giao dịch
 * @returns {Promise<Object>} Thông tin giao dịch
 */
const getTransactionById = async (transactionId) => {
  try {
    const query = `
      SELECT id, user_id, lawyer_id, case_id, amount, 
        payment_method, status, description, payment_info,
        created_at, updated_at
      FROM Transactions
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [transactionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi lấy thông tin giao dịch:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái giao dịch
 * @param {number} transactionId - ID giao dịch
 * @param {string} status - Trạng thái mới
 * @param {Object} paymentInfo - Thông tin thanh toán
 * @returns {Promise<Object>} Giao dịch đã cập nhật
 */
const updateTransactionStatus = async (transactionId, status, paymentInfo = {}) => {
  try {
    const query = `
      UPDATE Transactions
      SET status = $1, payment_info = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, status, updated_at
    `;
    
    const values = [
      status,
      JSON.stringify(paymentInfo),
      transactionId
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy giao dịch');
    }
    
    return await getTransactionById(transactionId);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái vụ án
 * @param {number} caseId - ID vụ án
 * @param {string} status - Trạng thái mới
 * @returns {Promise<Object>} Vụ án đã cập nhật
 */
const updateCaseStatus = async (caseId, status) => {
  try {
    const query = `
      UPDATE LegalCases
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, status
    `;
    
    const result = await pool.query(query, [status, caseId]);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy vụ án');
    }
    
    return await getLegalCaseById(caseId);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái vụ án:', error);
    throw error;
  }
};

/**
 * Lấy thông tin người dùng theo ID
 * @param {number} userId - ID người dùng
 * @returns {Promise<Object>} Thông tin người dùng
 */
const getUserById = async (userId) => {
  try {
    const query = `
      SELECT id, username, email, full_name, role
      FROM Users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    throw error;
  }
};

/**
 * Lấy thông tin mẫu văn bản theo ID
 * @param {number} templateId - ID mẫu văn bản
 * @returns {Promise<Object>} Thông tin mẫu văn bản
 */
const getDocumentTemplateById = async (templateId) => {
  try {
    const query = `
      SELECT id, title, content, template_type, 
             language, created_at
      FROM DocumentTemplates
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [templateId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Thêm trường description nếu không có trong cơ sở dữ liệu
    const template = result.rows[0];
    if (!template.hasOwnProperty('description')) {
      template.description = ''; // Thêm trường description mặc định
    }
    
    return template;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin mẫu văn bản:', error);
    // Trả về mẫu giả để tránh lỗi
    return {
      id: templateId,
      title: 'Mẫu văn bản mặc định',
      content: 'Nội dung mẫu văn bản',
      template_type: 'default',
      description: '',
      language: 'vi',
      created_at: new Date()
    };
  }
};

/**
 * Cập nhật thông tin vụ án
 * @param {number} caseId - ID vụ án
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Vụ án đã cập nhật
 */
const updateLegalCase = async (caseId, updateData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Xây dựng câu lệnh UPDATE động
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (['title', 'description', 'case_type', 'file_url', 'status', 'ai_content', 'is_ai_generated', 'notes', 'fee_amount', 'fee_details'].includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Luôn cập nhật trường updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Kiểm tra nếu không có trường nào được cập nhật
    if (updateFields.length === 1 && updateFields[0] === 'updated_at = NOW()') {
      return await getLegalCaseById(caseId);
    }
    
    // Thực hiện câu lệnh UPDATE
    const query = `
      UPDATE LegalCases
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `;
    
    values.push(caseId);
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy vụ án hoặc vụ án đã bị xóa');
    }
    
    await client.query('COMMIT');
    
    // Trả về vụ án đã cập nhật
    return await getLegalCaseById(caseId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Lỗi khi cập nhật vụ án ID ${caseId}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Xóa vụ án (soft delete)
 * @param {number} caseId - ID vụ án
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteLegalCase = async (caseId) => {
  try {
    const query = `
      UPDATE LegalCases
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    
    const result = await pool.query(query, [caseId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Lỗi khi xóa vụ án:', error);
    throw error;
  }
};

/**
 * Lấy danh sách loại vụ án
 * @returns {Promise<Array>} Danh sách loại vụ án
 */
const getCaseTypes = async () => {
  try {
    // Trả về dữ liệu mặc định thay vì truy vấn cơ sở dữ liệu
    // Đảm bảo case_type_code khớp với bảng FeeReferences
    return [
      { case_type: 'Dân sự', case_type_code: 'civil', description: 'Tranh chấp dân sự, hợp đồng, đất đai' },
      { case_type: 'Hình sự', case_type_code: 'criminal', description: 'Bào chữa, tư vấn các vụ án hình sự' },
      { case_type: 'Hành chính', case_type_code: 'administrative', description: 'Khiếu nại, tố cáo hành chính' },
      { case_type: 'Lao động', case_type_code: 'labor', description: 'Tranh chấp lao động, hợp đồng lao động' },
      { case_type: 'Hôn nhân gia đình', case_type_code: 'divorce', description: 'Ly hôn, phân chia tài sản, nuôi con' },
      { case_type: 'Kinh doanh thương mại', case_type_code: 'commercial', description: 'Tranh chấp thương mại, doanh nghiệp' },
      { case_type: 'Sở hữu trí tuệ', case_type_code: 'intellectual', description: 'Bản quyền, nhãn hiệu, sáng chế' },
      { case_type: 'Đất đai', case_type_code: 'land', description: 'Tranh chấp đất đai, quyền sử dụng đất' }
    ];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại vụ án:', error);
    
    // Trả về dữ liệu mặc định khi có lỗi để tránh lỗi 500
    return [
      { case_type: 'Dân sự', case_type_code: 'civil', description: 'Tranh chấp dân sự, hợp đồng, đất đai' },
      { case_type: 'Hình sự', case_type_code: 'criminal', description: 'Bào chữa, tư vấn các vụ án hình sự' },
      { case_type: 'Hành chính', case_type_code: 'administrative', description: 'Khiếu nại, tố cáo hành chính' },
      { case_type: 'Lao động', case_type_code: 'labor', description: 'Tranh chấp lao động, hợp đồng lao động' },
      { case_type: 'Hôn nhân gia đình', case_type_code: 'divorce', description: 'Ly hôn, phân chia tài sản, nuôi con' },
      { case_type: 'Kinh doanh thương mại', case_type_code: 'commercial', description: 'Tranh chấp thương mại, doanh nghiệp' },
      { case_type: 'Sở hữu trí tuệ', case_type_code: 'intellectual', description: 'Bản quyền, nhãn hiệu, sáng chế' },
      { case_type: 'Đất đai', case_type_code: 'land', description: 'Tranh chấp đất đai, quyền sử dụng đất' }
    ];
  }
};

module.exports = {
  createLegalCase,
  getLegalCasesByUserId,
  getLegalCasesByLawyerId,
  getLegalCaseById,
  assignLawyer,
  createAppointment,
  calculateFee,
  updateFeeInfo,
  createPaymentTransaction,
  getTransactionById,
  updateTransactionStatus,
  updateCaseStatus,
  getUserById,
  getDocumentTemplateById,
  updateLegalCase,
  deleteLegalCase,
  getCaseTypes
}; 