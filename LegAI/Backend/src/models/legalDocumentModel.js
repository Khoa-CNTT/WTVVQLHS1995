const pool = require('../config/database');

/**
 * Lấy tất cả văn bản pháp luật với phân trang và tìm kiếm
 * @param {Object} options - Các tùy chọn tìm kiếm
 * @param {string} options.searchTerm - Từ khóa tìm kiếm
 * @param {string} options.documentType - Loại văn bản
 * @param {Date} options.fromDate - Từ ngày
 * @param {Date} options.toDate - Đến ngày
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số lượng kết quả mỗi trang
 * @returns {Promise<Array>} Danh sách văn bản pháp luật
 */
const getAllLegalDocuments = async (options = {}) => {
  try {
    const {
      searchTerm = '',
      documentType = '',
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 10
    } = options;

    // Xây dựng truy vấn từ database nội bộ
    let query = `
      SELECT * FROM LegalDocuments
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Thêm điều kiện tìm kiếm theo từ khóa
    if (searchTerm) {
      query += ` AND (
        title ILIKE $${paramIndex} 
        OR content ILIKE $${paramIndex} 
        OR summary ILIKE $${paramIndex}
        OR id IN (SELECT document_id FROM LegalKeywords WHERE keyword ILIKE $${paramIndex})
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Thêm điều kiện tìm kiếm theo loại văn bản
    if (documentType) {
      query += ` AND document_type = $${paramIndex}`;
      queryParams.push(documentType);
      paramIndex++;
    }

    // Thêm điều kiện tìm kiếm theo khoảng thời gian
    if (fromDate) {
      query += ` AND issued_date >= $${paramIndex}`;
      queryParams.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND issued_date <= $${paramIndex}`;
      queryParams.push(toDate);
      paramIndex++;
    }

    // Thêm phân trang
    const offset = (page - 1) * limit;
    
    // Đếm tổng số bản ghi
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, queryParams);
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    query += ` ORDER BY issued_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Lấy keywords cho mỗi văn bản
    for (const doc of result.rows) {
      const keywordsResult = await pool.query(
        'SELECT keyword FROM LegalKeywords WHERE document_id = $1',
        [doc.id]
      );
      doc.keywords = keywordsResult.rows.map(row => row.keyword);
    }

    return {
      documents: result.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Định dạng ngày cho database
 * @param {Date} date - Đối tượng Date
 * @returns {string} Chuỗi ngày định dạng YYYY-MM-DD
 */
const formatDateForDB = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Lấy thông tin chi tiết một văn bản pháp luật
 * @param {number|string} documentId - ID của văn bản
 * @returns {Promise<Object>} Thông tin văn bản
 */
const getLegalDocumentById = async (documentId) => {
  try {
    // Lấy từ database nội bộ
    const result = await pool.query(
      'SELECT * FROM LegalDocuments WHERE id = $1',
      [documentId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Lấy các từ khóa liên quan
    const keywordsResult = await pool.query(
      'SELECT keyword FROM LegalKeywords WHERE document_id = $1',
      [documentId]
    );
    
    const document = result.rows[0];
    document.keywords = keywordsResult.rows.map(row => row.keyword);
    
    return document;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy các loại văn bản pháp luật
 * @returns {Promise<Array>} Danh sách loại văn bản
 */
const getDocumentTypes = async () => {
  try {
    // Lấy từ database nội bộ
    const result = await pool.query(
      'SELECT DISTINCT document_type FROM LegalDocuments ORDER BY document_type'
    );
    return result.rows.map(row => ({
      id: row.document_type,
      name: row.document_type
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách cơ quan ban hành
 * @returns {Promise<Array>} Danh sách cơ quan ban hành
 */
const getIssuingBodies = async () => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT issuer FROM LegalDocuments WHERE issuer IS NOT NULL ORDER BY issuer'
    );
    return result.rows.map(row => ({
      id: row.issuer,
      name: row.issuer
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách lĩnh vực
 * @returns {Promise<Array>} Danh sách lĩnh vực
 */
const getLegalFields = async () => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT keyword FROM LegalKeywords ORDER BY keyword'
    );
    return result.rows.map(row => ({
      id: row.keyword,
      name: row.keyword
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách trạng thái hiệu lực
 * @returns {Promise<Array>} Danh sách trạng thái hiệu lực
 */
const getEffectStatus = async () => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT status FROM LegalDocuments WHERE status IS NOT NULL ORDER BY status'
    );
    return result.rows.map(row => ({
      id: row.status,
      name: row.status
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách mẫu văn bản pháp luật với tùy chọn tìm kiếm và phân trang
 * @param {Object} options - Các tùy chọn tìm kiếm và phân trang
 * @returns {Promise<Object>} Danh sách mẫu văn bản và thông tin phân trang
 */
async function getDocumentTemplates(options = {}) {
  const { searchTerm, templateType, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT t.id, t.title, t.description, t.content, t.created_at, t.updated_at,
           tt.id as template_type_id, tt.name as template_type_name
    FROM document_templates t
    LEFT JOIN template_types tt ON t.template_type_id = tt.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  
  if (searchTerm) {
    query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }
  
  if (templateType) {
    query += ` AND tt.id = ?`;
    queryParams.push(templateType);
  }
  
  // Đếm tổng số bản ghi phù hợp
  const countQuery = `
    SELECT COUNT(*) as total
    FROM document_templates t
    LEFT JOIN template_types tt ON t.template_type_id = tt.id
    WHERE 1=1
    ${searchTerm ? ` AND (t.title LIKE ? OR t.description LIKE ?)` : ''}
    ${templateType ? ` AND tt.id = ?` : ''}
  `;
  
  const [countResult] = await pool.query(countQuery, queryParams);
  const totalRecords = countResult[0].total;
  
  // Thêm phân trang
  query += ` ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(Number(limit), Number(offset));
  
  const [templates] = await pool.query(query, queryParams);
  
  // Tính toán thông tin phân trang
  const totalPages = Math.ceil(totalRecords / limit);
  
  return {
    data: templates,
    pagination: {
      total: totalRecords,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  };
}

/**
 * Lấy chi tiết mẫu văn bản theo ID
 * @param {number} id - ID của mẫu văn bản
 * @returns {Promise<Object>} Chi tiết mẫu văn bản
 */
async function getDocumentTemplateById(id) {
  const query = `
    SELECT t.id, t.title, t.description, t.content, t.created_at, t.updated_at,
           tt.id as template_type_id, tt.name as template_type_name
    FROM document_templates t
    LEFT JOIN template_types tt ON t.template_type_id = tt.id
    WHERE t.id = ?
  `;
  
  const [result] = await pool.query(query, [id]);
  
  if (result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Lấy danh sách loại mẫu văn bản
 * @returns {Promise<Array>} Danh sách loại mẫu văn bản
 */
async function getTemplateTypes() {
  const query = `
    SELECT id, name
    FROM template_types
    ORDER BY name ASC
  `;
  
  const [result] = await pool.query(query);
  
  return result;
}

/**
 * Tìm kiếm tổng hợp các văn bản pháp luật
 * @param {Object} options - Các tùy chọn tìm kiếm và phân trang
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
async function searchAll(options = {}) {
  const { searchTerm, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  if (!searchTerm) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: 0
      }
    };
  }
  
  let query = `
    SELECT 
      d.id, 
      d.code, 
      d.title, 
      d.summary,
      dt.name as document_type,
      ib.name as issuing_body,
      d.issued_date,
      es.name as effect_status,
      'legal_document' as result_type
    FROM legal_documents d
    LEFT JOIN document_types dt ON d.document_type_id = dt.id
    LEFT JOIN issuing_bodies ib ON d.issuing_body_id = ib.id
    LEFT JOIN effect_status es ON d.effect_status_id = es.id
    WHERE (d.title LIKE ? OR d.code LIKE ? OR d.summary LIKE ?)
    
    UNION
    
    SELECT 
      t.id,
      '' as code,
      t.title,
      t.description as summary,
      tt.name as document_type,
      '' as issuing_body,
      t.created_at as issued_date,
      '' as effect_status,
      'template' as result_type
    FROM document_templates t
    LEFT JOIN template_types tt ON t.template_type_id = tt.id
    WHERE (t.title LIKE ? OR t.description LIKE ?)
  `;
  
  const searchPattern = `%${searchTerm}%`;
  const queryParams = [
    searchPattern, searchPattern, searchPattern,
    searchPattern, searchPattern
  ];
  
  // Đếm tổng số bản ghi phù hợp
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT d.id
      FROM legal_documents d
      WHERE (d.title LIKE ? OR d.code LIKE ? OR d.summary LIKE ?)
      
      UNION
      
      SELECT t.id
      FROM document_templates t
      WHERE (t.title LIKE ? OR t.description LIKE ?)
    ) as results
  `;
  
  const [countResult] = await pool.query(countQuery, [
    searchPattern, searchPattern, searchPattern,
    searchPattern, searchPattern
  ]);
  const totalRecords = countResult[0].total;
  
  // Thêm phân trang
  query += ` ORDER BY issued_date DESC LIMIT ? OFFSET ?`;
  queryParams.push(Number(limit), Number(offset));
  
  const [results] = await pool.query(query, queryParams);
  
  // Tính toán thông tin phân trang
  const totalPages = Math.ceil(totalRecords / limit);
  
  return {
    data: results,
    pagination: {
      total: totalRecords,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  };
}

module.exports = {
  getAllLegalDocuments,
  getLegalDocumentById,
  getDocumentTypes,
  getDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll,
  getIssuingBodies,
  getLegalFields,
  getEffectStatus
}; 