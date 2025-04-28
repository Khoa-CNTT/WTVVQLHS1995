const pool = require('../config/database');

// Kiểm tra và thêm trường deleted_at vào bảng Contracts nếu chưa tồn tại
const ensureDeletedAtField = async () => {
  try {
    // Kiểm tra xem trường deleted_at đã tồn tại chưa
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'deleted_at'
    `;
    
    const result = await pool.query(checkQuery);
    
    if (result.rows.length === 0) {
      console.log('Trường deleted_at chưa tồn tại, thêm vào bảng Contracts...');
      
      // Thêm trường deleted_at
      const alterQuery = `
        ALTER TABLE Contracts
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      `;
      
      await pool.query(alterQuery);
      console.log('Đã thêm trường deleted_at vào bảng Contracts');
    } else {
      console.log('Trường deleted_at đã tồn tại trong bảng Contracts');
    }
    
    // Kiểm tra ràng buộc của end_date và signature
    const checkNullableQuery = `
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name IN ('end_date', 'signature')
    `;
    
    const nullableResult = await pool.query(checkNullableQuery);
    
    for (const row of nullableResult.rows) {
      if (row.is_nullable === 'NO') {
        console.log(`Trường ${row.column_name} hiện là NOT NULL, cập nhật thành NULL...`);
        
        const alterNullableQuery = `
          ALTER TABLE Contracts
          ALTER COLUMN ${row.column_name} DROP NOT NULL;
        `;
        
        await pool.query(alterNullableQuery);
        console.log(`Đã cập nhật trường ${row.column_name} thành NULL`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra/thêm trường deleted_at:', error);
    return false;
  }
};

// Kiểm tra và thêm trường partner vào bảng Contracts nếu chưa tồn tại
const ensurePartnerField = async () => {
  try {
    // Kiểm tra xem trường partner đã tồn tại chưa
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' AND column_name = 'partner'
    `;
    
    const result = await pool.query(checkQuery);
    
    if (result.rows.length === 0) {
      console.log('Trường partner chưa tồn tại, thêm vào bảng Contracts...');
      
      // Thêm trường partner
      const alterQuery = `
        ALTER TABLE Contracts
        ADD COLUMN IF NOT EXISTS partner VARCHAR(255) NOT NULL DEFAULT 'Chưa xác định';
      `;
      
      await pool.query(alterQuery);
      console.log('Đã thêm trường partner vào bảng Contracts');
    } else {
      console.log('Trường partner đã tồn tại trong bảng Contracts');
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra/thêm trường partner:', error);
    return false;
  }
};

// Thực hiện migration khi module được load
ensureDeletedAtField()
  .then(result => {
    if (result) {
      console.log('Kiểm tra cấu trúc bảng Contracts thành công');
    } else {
      console.error('Lỗi khi kiểm tra cấu trúc bảng Contracts');
    }
  })
  .catch(error => {
    console.error('Lỗi không mong đợi khi kiểm tra cấu trúc bảng:', error);
  });

ensurePartnerField()
  .then(result => {
    if (result) {
      console.log('Kiểm tra trường partner thành công');
    } else {
      console.error('Lỗi khi kiểm tra trường partner');
    }
  })
  .catch(error => {
    console.error('Lỗi không mong đợi khi kiểm tra trường partner:', error);
  });

/**
 * Lấy danh sách hợp đồng của người dùng
 * @param {number} userId - ID của người dùng
 * @param {number} page - Số trang (mặc định là 1)
 * @param {number} limit - Số bản ghi trên một trang (mặc định là 10)
 * @returns {Promise<Object>} - Danh sách hợp đồng và tổng số bản ghi
 */
const getContracts = async (userId, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    // Kiểm tra xem bảng có trường deleted_at không
    let hasDeletedAtField = false;
    try {
      // Thử truy vấn metadata để kiểm tra trường tồn tại
      const checkFieldQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'deleted_at'
      `;
      const fieldResult = await pool.query(checkFieldQuery);
      hasDeletedAtField = fieldResult.rows.length > 0;
    } catch (error) {
      console.log('Không thể kiểm tra trường deleted_at:', error);
      // Tiếp tục với giả định rằng trường không tồn tại
    }
    
    // Truy vấn lấy danh sách hợp đồng
    const query = `
      SELECT 
        id, title, contract_type, partner, start_date, end_date, 
        signature, file_url, created_at, updated_at
      FROM Contracts 
      WHERE user_id = $1 ${hasDeletedAtField ? 'AND deleted_at IS NULL' : ''}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    // Đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Contracts
      WHERE user_id = $1 ${hasDeletedAtField ? 'AND deleted_at IS NULL' : ''}
    `;
    
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);
    
    return {
      contracts: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hợp đồng:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết hợp đồng theo ID
 * @param {number} contractId - ID của hợp đồng
 * @param {number} userId - ID của người dùng (để kiểm tra quyền truy cập)
 * @returns {Promise<Object>} - Chi tiết hợp đồng
 */
const getContractById = async (contractId, userId) => {
  try {
    // Kiểm tra xem bảng có trường deleted_at không
    let hasDeletedAtField = false;
    try {
      // Thử truy vấn metadata để kiểm tra trường tồn tại
      const checkFieldQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'deleted_at'
      `;
      const fieldResult = await pool.query(checkFieldQuery);
      hasDeletedAtField = fieldResult.rows.length > 0;
    } catch (error) {
      console.log('Không thể kiểm tra trường deleted_at:', error);
      // Tiếp tục với giả định rằng trường không tồn tại
    }
    
    const query = `
      SELECT 
        id, title, contract_type, partner, start_date, end_date, 
        signature, file_url, created_at, updated_at
      FROM Contracts 
      WHERE id = $1 AND user_id = $2 ${hasDeletedAtField ? 'AND deleted_at IS NULL' : ''}
    `;
    
    const result = await pool.query(query, [contractId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy hợp đồng');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

/**
 * Tạo hợp đồng mới
 * @param {Object} contractData - Dữ liệu hợp đồng
 * @returns {Promise<Object>} - Hợp đồng đã tạo
 */
const createContract = async (contractData) => {
  const { 
    userId, title, contract_type, partner, 
    start_date, end_date, signature, file_url 
  } = contractData;
  
  try {
    // Kiểm tra cấu trúc bảng và các ràng buộc
    let columnsQuery;
    try {
      columnsQuery = `
        SELECT column_name, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'contracts'
      `;
      const columnsResult = await pool.query(columnsQuery);
      
      // Lấy thông tin về các cột nullable
      const columnsInfo = {};
      columnsResult.rows.forEach(row => {
        columnsInfo[row.column_name] = {
          is_nullable: row.is_nullable === 'YES'
        };
      });
      
      console.log('Thông tin cột của bảng Contracts:', columnsInfo);
    } catch (error) {
      console.error('Không thể lấy thông tin cấu trúc bảng Contracts:', error);
    }
    
    // Tạo câu query động dựa trên các trường
    const fields = [];
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    // Các trường bắt buộc
    fields.push('user_id');
    placeholders.push(`$${paramIndex++}`);
    values.push(userId);
    
    fields.push('title');
    placeholders.push(`$${paramIndex++}`);
    values.push(title);
    
    fields.push('contract_type');
    placeholders.push(`$${paramIndex++}`);
    values.push(contract_type);
    
    fields.push('partner');
    placeholders.push(`$${paramIndex++}`);
    values.push(partner);
    
    fields.push('start_date');
    placeholders.push(`$${paramIndex++}`);
    values.push(start_date);
    
    fields.push('file_url');
    placeholders.push(`$${paramIndex++}`);
    values.push(file_url);
    
    // Các trường không bắt buộc
    if (end_date !== undefined && end_date !== null) {
      fields.push('end_date');
      placeholders.push(`$${paramIndex++}`);
      values.push(end_date);
    }
    
    if (signature !== undefined && signature !== null) {
      fields.push('signature');
      placeholders.push(`$${paramIndex++}`);
      values.push(signature);
    }
    
    const query = `
      INSERT INTO Contracts (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING 
        id, title, contract_type, partner, start_date, end_date, 
        signature, file_url, created_at, updated_at
    `;
    
    console.log('Query tạo contract:', query);
    console.log('Giá trị tham số:', values);
    
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng mới:', error);
    throw error;
  }
};

/**
 * Cập nhật hợp đồng
 * @param {number} contractId - ID của hợp đồng cần cập nhật
 * @param {number} userId - ID của người dùng (để kiểm tra quyền truy cập)
 * @param {Object} contractData - Dữ liệu cập nhật
 * @returns {Promise<Object>} - Hợp đồng đã cập nhật
 */
const updateContract = async (contractId, userId, contractData) => {
  try {
    // Kiểm tra xem bảng có trường deleted_at không
    let hasDeletedAtField = false;
    try {
      const checkFieldQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'deleted_at'
      `;
      const fieldResult = await pool.query(checkFieldQuery);
      hasDeletedAtField = fieldResult.rows.length > 0;
    } catch (error) {
      console.log('Không thể kiểm tra trường deleted_at:', error);
    }
    
    // Kiểm tra hợp đồng tồn tại và thuộc về người dùng
    const checkQuery = `
      SELECT id, file_url FROM Contracts
      WHERE id = $1 AND user_id = $2 ${hasDeletedAtField ? 'AND deleted_at IS NULL' : ''}
    `;
    
    const checkResult = await pool.query(checkQuery, [contractId, userId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Không tìm thấy hợp đồng hoặc bạn không có quyền cập nhật');
    }
    
    // Xây dựng câu lệnh cập nhật động
    let setClause = [];
    let values = [];
    let paramIndex = 1;
    
    // Lưu lại URL file hiện tại để trả về
    const currentFileUrl = checkResult.rows[0].file_url;
    
    // Xây dựng câu lệnh SET cho các trường cập nhật
    const fields = ['title', 'contract_type', 'partner', 'start_date', 'end_date', 'signature', 'file_url'];
    
    fields.forEach(field => {
      if (contractData[field] !== undefined) {
        setClause.push(`${field} = $${paramIndex}`);
        values.push(contractData[field]);
        paramIndex++;
      }
    });
    
    // Thêm updated_at
    setClause.push(`updated_at = NOW()`);
    
    // Nếu không có trường nào được cập nhật
    if (setClause.length === 1) {
      // Chỉ có updated_at, trả về hợp đồng hiện tại
      const query = `
        SELECT 
          id, title, contract_type, partner, start_date, end_date, 
          signature, file_url, created_at, updated_at
        FROM Contracts 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [contractId]);
      return result.rows[0];
    }
    
    // Cập nhật hợp đồng
    const query = `
      UPDATE Contracts 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING 
        id, title, contract_type, partner, start_date, end_date, 
        signature, file_url, created_at, updated_at
    `;
    
    // Thêm contractId và userId vào mảng values
    values.push(contractId, userId);
    
    const result = await pool.query(query, values);
    
    // Trả về cả file_url hiện tại nếu không có file mới
    if (!contractData.file_url) {
      result.rows[0].file_url = currentFileUrl;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Lỗi khi cập nhật hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

/**
 * Xóa hợp đồng
 * @param {number} contractId - ID của hợp đồng cần xóa
 * @param {number} userId - ID của người dùng (để kiểm tra quyền truy cập)
 * @returns {Promise<Object>} - Kết quả xóa
 */
const deleteContract = async (contractId, userId) => {
  try {
    // Kiểm tra xem bảng có trường deleted_at không
    let hasDeletedAtField = false;
    try {
      const checkFieldQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'deleted_at'
      `;
      const fieldResult = await pool.query(checkFieldQuery);
      hasDeletedAtField = fieldResult.rows.length > 0;
    } catch (error) {
      console.log('Không thể kiểm tra trường deleted_at:', error);
    }
    
    // Kiểm tra hợp đồng tồn tại và thuộc về người dùng
    const checkQuery = `
      SELECT id, file_url FROM Contracts
      WHERE id = $1 AND user_id = $2 ${hasDeletedAtField ? 'AND deleted_at IS NULL' : ''}
    `;
    
    const checkResult = await pool.query(checkQuery, [contractId, userId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Không tìm thấy hợp đồng hoặc bạn không có quyền xóa');
    }
    
    // Lấy đường dẫn file để xóa file
    const fileUrl = checkResult.rows[0].file_url;
    
    let result;
    
    if (hasDeletedAtField) {
    // Xóa mềm bằng cách cập nhật deleted_at
    const query = `
      UPDATE Contracts 
      SET deleted_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
      result = await pool.query(query, [contractId, userId]);
    } else {
      // Xóa cứng nếu không có trường deleted_at
      const query = `
        DELETE FROM Contracts 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      result = await pool.query(query, [contractId, userId]);
    }
    
    return {
      success: true,
      id: result.rows[0].id,
      fileUrl
    };
  } catch (error) {
    console.error(`Lỗi khi xóa hợp đồng ID ${contractId}:`, error);
    throw error;
  }
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
}; 