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
 * @param {boolean} options.caseInsensitive - Có phân biệt hoa thường hay không
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
      limit = 10,
      caseInsensitive = true
    } = options;

    // Xây dựng truy vấn từ database nội bộ
    let query = `
      SELECT 
        ld.id, 
        ld.title, 
        ld.document_type, 
        ld.version,
        ld.content,
        ld.summary, 
        ld.issued_date, 
        ld.created_at,
        ld.language
      FROM LegalDocuments ld
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Thêm điều kiện tìm kiếm theo từ khóa
    if (searchTerm) {
      // Kiểm tra nếu searchTerm có thể là tiêu đề chính xác
      query += ` AND (
        ld.title ILIKE $${paramIndex} 
        OR ld.title ILIKE $${paramIndex + 1}
        OR ld.content ILIKE $${paramIndex + 2} 
        OR ld.summary ILIKE $${paramIndex + 2}
        OR ld.id IN (SELECT document_id FROM LegalKeywords WHERE keyword ILIKE $${paramIndex + 2})
      )`;
      // Ưu tiên kết quả khớp chính xác với tiêu đề hơn
      queryParams.push(searchTerm); // Khớp chính xác tiêu đề
      queryParams.push(`%${searchTerm}`); // Khớp tiêu đề bắt đầu bằng searchTerm
      queryParams.push(`%${searchTerm}%`); // Khớp mờ
      paramIndex += 3;
    }

    // Thêm điều kiện tìm kiếm theo loại văn bản
    if (documentType) {
      if (caseInsensitive) {
        query += ` AND LOWER(ld.document_type) = LOWER($${paramIndex})`;
      } else {
        query += ` AND ld.document_type = $${paramIndex}`;
      }
      queryParams.push(documentType);
      paramIndex++;
    }

    // Thêm điều kiện tìm kiếm theo khoảng thời gian
    if (fromDate) {
      query += ` AND ld.issued_date >= $${paramIndex}`;
      queryParams.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND ld.issued_date <= $${paramIndex}`;
      queryParams.push(toDate);
      paramIndex++;
    }

    // Truy vấn đếm tổng số bản ghi 
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM LegalDocuments ld
      WHERE 1=1
    `;

    // Thêm điều kiện cho countQuery
    if (searchTerm) {
      countQuery += ` AND (
        ld.title ILIKE $1 
        OR ld.content ILIKE $1 
        OR ld.summary ILIKE $1
        OR ld.id IN (SELECT document_id FROM LegalKeywords WHERE keyword ILIKE $1)
      )`;
    }

    if (documentType) {
      const docTypeParamIndex = searchTerm ? 2 : 1;
      if (caseInsensitive) {
        countQuery += ` AND LOWER(ld.document_type) = LOWER($${docTypeParamIndex})`;
      } else {
        countQuery += ` AND ld.document_type = $${docTypeParamIndex}`;
      }
    }

    if (fromDate) {
      const fromDateParamIndex = (searchTerm ? 1 : 0) + (documentType ? 1 : 0) + 1;
      countQuery += ` AND ld.issued_date >= $${fromDateParamIndex}`;
    }

    if (toDate) {
      const toDateParamIndex = (searchTerm ? 1 : 0) + (documentType ? 1 : 0) + (fromDate ? 1 : 0) + 1;
      countQuery += ` AND ld.issued_date <= $${toDateParamIndex}`;
    }

    const countParams = [];
    if (searchTerm) countParams.push(`%${searchTerm}%`);
    if (documentType) countParams.push(documentType);
    if (fromDate) countParams.push(fromDate);
    if (toDate) countParams.push(toDate);

    // Thêm phân trang
    const offset = (page - 1) * limit;
    query += ` ORDER BY ld.issued_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Thực hiện truy vấn
    const [documentsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const documents = documentsResult.rows;
    
    // Lấy từ khóa cho mỗi văn bản
    const documentIds = documents.map(doc => doc.id);
    
    // Nếu có văn bản, lấy từ khóa cho mỗi văn bản
    if (documentIds.length > 0) {
      // Sử dụng một truy vấn duy nhất để lấy tất cả từ khóa cho tất cả văn bản
      const keywordsQuery = `
        SELECT document_id, keyword 
        FROM LegalKeywords 
        WHERE document_id = ANY($1::int[])
        ORDER BY document_id, keyword
      `;
      
      const keywordsResult = await pool.query(keywordsQuery, [documentIds]);
      
      // Tạo map từ ID văn bản tới danh sách từ khóa
      const keywordsByDocId = {};
      keywordsResult.rows.forEach(row => {
        if (!keywordsByDocId[row.document_id]) {
          keywordsByDocId[row.document_id] = [];
        }
        keywordsByDocId[row.document_id].push(row.keyword);
      });
      
      // Gán từ khóa vào từng văn bản
      documents.forEach(doc => {
        doc.keywords = keywordsByDocId[doc.id] || [];
      });
    } else {
      // Nếu không có văn bản, gán mảng rỗng cho tất cả
      documents.forEach(doc => {
        doc.keywords = [];
      });
    }

    // Định dạng kết quả trả về
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: documents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
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
  if (!date) return null;
  
  // Nếu là string, chuyển thành đối tượng Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Định dạng YYYY-MM-DD
  return dateObj.toISOString().split('T')[0];
};

// Định dạng ngày tháng để hiển thị
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Lấy thông tin chi tiết một văn bản pháp luật
 * @param {number|string} documentId - ID của văn bản
 * @returns {Promise<Object>} Thông tin văn bản
 */
const getLegalDocumentById = async (documentId) => {
  try {
    // Lấy thông tin văn bản
    const documentQuery = `
      SELECT 
        id, 
        title, 
        document_type, 
        version, 
        content,
        summary,
        issued_date,
        created_at,
        language
      FROM LegalDocuments 
      WHERE id = $1
    `;
    
    const documentResult = await pool.query(documentQuery, [documentId]);
    
    if (documentResult.rows.length === 0) {
      return null;
    }
    
    const document = documentResult.rows[0];
    
    // Lấy từ khóa liên quan
    const keywordsQuery = `
      SELECT keyword 
      FROM LegalKeywords 
      WHERE document_id = $1
      ORDER BY keyword
    `;
    
    const keywordsResult = await pool.query(keywordsQuery, [documentId]);
    
    // Đảm bảo document.keywords luôn là một mảng, không phụ thuộc vào kết quả truy vấn
    document.keywords = keywordsResult.rows.map(row => row.keyword);
    
    // Định dạng các trường ngày tháng nếu cần
    if (document.issued_date) {
      document.issued_date_formatted = formatDate(document.issued_date);
    }
    
    return document;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy các loại văn bản pháp luật (nhóm theo tên không phân biệt hoa thường)
 * @returns {Promise<Array>} Danh sách loại văn bản
 */
const getDocumentTypes = async () => {
  try {
    const query = `
      SELECT DISTINCT document_type 
      FROM LegalDocuments 
      ORDER BY document_type
    `;
    
    const result = await pool.query(query);
    
    // Tạo map để nhóm các loại văn bản không phân biệt hoa thường
    const documentTypeMap = new Map();
    
    result.rows.forEach(row => {
      const lowerCaseType = row.document_type.toLowerCase();
      // Nếu loại này chưa có trong map hoặc version hiện tại dài hơn, cập nhật
      if (!documentTypeMap.has(lowerCaseType) || 
          row.document_type.length > documentTypeMap.get(lowerCaseType).length) {
        documentTypeMap.set(lowerCaseType, row.document_type);
      }
    });
    
    // Chuyển map thành array kết quả
    const types = Array.from(documentTypeMap.values()).map(docType => ({
      id: docType,
      name: docType
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    
    return types;
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
    // Giả sử ta lưu cơ quan ban hành trong trường document_type hoặc trích từ tiêu đề
    const query = `
      SELECT DISTINCT document_type as issuing_body
      FROM LegalDocuments
      ORDER BY document_type
    `;
    
    const result = await pool.query(query);
    
    const issuers = result.rows.map(row => ({
      id: row.issuing_body,
      name: row.issuing_body
    }));
    
    return issuers;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách lĩnh vực pháp luật
 * @returns {Promise<Array>} Danh sách lĩnh vực
 */
const getLegalFields = async () => {
  try {
    // Để đơn giản, ta có thể lấy từ các từ khóa phổ biến
    const query = `
      SELECT keyword as field
      FROM LegalKeywords
      GROUP BY keyword
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    const fields = result.rows.map(row => ({
      id: row.field,
      name: row.field
    }));
    
    return fields;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách trạng thái hiệu lực
 * @returns {Promise<Array>} Danh sách trạng thái
 */
const getEffectStatus = async () => {
  try {
    // Giả sử ta có các trạng thái cố định 
    const statuses = [
      { id: 'active', name: 'Còn hiệu lực' },
      { id: 'expired', name: 'Hết hiệu lực' },
      { id: 'pending', name: 'Chưa có hiệu lực' },
      { id: 'amended', name: 'Được sửa đổi, bổ sung' }
    ];
    
    return statuses;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách mẫu văn bản
 * @param {Object} options - Các tùy chọn tìm kiếm
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
async function getDocumentTemplates(options = {}) {
  try {
    const {
      searchTerm = '',
      templateType = '',
      page = 1,
      limit = 10
    } = options;

    // Xây dựng truy vấn
    let query = `
      SELECT 
        id, 
        title, 
        template_type, 
        content,
        created_at,
        language
      FROM DocumentTemplates
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Thêm điều kiện tìm kiếm theo từ khóa
    if (searchTerm) {
      query += ` AND (
        title ILIKE $${paramIndex} 
        OR content ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Thêm điều kiện tìm kiếm theo loại mẫu
    if (templateType) {
      query += ` AND template_type = $${paramIndex}`;
      queryParams.push(templateType);
      paramIndex++;
    }

    // Truy vấn đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM DocumentTemplates 
      WHERE 1=1
      ${searchTerm ? ` AND (title ILIKE $1 OR content ILIKE $1)` : ''}
      ${templateType ? ` AND template_type = $${searchTerm ? 2 : 1}` : ''}
    `;

    const countParams = [];
    if (searchTerm) countParams.push(`%${searchTerm}%`);
    if (templateType) countParams.push(templateType);

    // Thêm phân trang
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Thực hiện truy vấn
    const [templatesResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const templates = templatesResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy chi tiết mẫu văn bản theo ID
 * @param {number|string} id - ID mẫu văn bản
 * @returns {Promise<Object>} Thông tin mẫu văn bản
 */
async function getDocumentTemplateById(id) {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        template_type, 
        content,
        created_at,
        language
      FROM DocumentTemplates 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const template = result.rows[0];
    
    return template;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách loại mẫu văn bản
 * @returns {Promise<Array>} Danh sách loại mẫu văn bản
 */
async function getTemplateTypes() {
  try {
    const query = `
      SELECT DISTINCT template_type
      FROM DocumentTemplates
      ORDER BY template_type
    `;
    
    const result = await pool.query(query);
    
    const types = result.rows.map(row => ({
      id: row.template_type,
      name: row.template_type
    }));
    
    return types;
  } catch (error) {
    throw error;
  }
}

/**
 * Tìm kiếm tổng hợp các văn bản pháp luật và mẫu văn bản
 * @param {Object} options - Các tùy chọn tìm kiếm
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
async function searchAll(options = {}) {
  try {
    const { 
      searchTerm = '', 
      page = 1, 
      limit = 10,
      documentType = '',
      fromDate = null,
      toDate = null,
      language = ''
    } = options;
    
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

    // Chuẩn bị tham số tìm kiếm
    const searchQueries = [
      `%${searchTerm}%`, // Tìm kiếm mờ (wildcard)
      searchTerm,        // Khớp chính xác
      `${searchTerm}%`   // Bắt đầu bằng từ khóa
    ];
    
    // Xây dựng các phần của truy vấn SQL
    let documentConditions = `
      title ILIKE $1 
      OR title = $2
      OR title ILIKE $3
      OR content ILIKE $1 
      OR summary ILIKE $1
      OR id IN (SELECT document_id FROM LegalKeywords WHERE keyword ILIKE $1)
    `;
    
    let templateConditions = `
      title ILIKE $1 
      OR title = $2
      OR title ILIKE $3
      OR content ILIKE $1
    `;
    
    // Thêm điều kiện lọc theo loại văn bản
    const additionalParams = [];
    let paramIndex = 4;
    
    if (documentType) {
      documentConditions += ` AND LOWER(document_type) = LOWER($${paramIndex})`;
      templateConditions += ` AND LOWER(template_type) = LOWER($${paramIndex})`;
      additionalParams.push(documentType);
      paramIndex++;
    }
    
    // Thêm điều kiện lọc theo ngày
    if (fromDate) {
      documentConditions += ` AND issued_date >= $${paramIndex}`;
      templateConditions += ` AND created_at >= $${paramIndex}`;
      additionalParams.push(fromDate);
      paramIndex++;
    }
    
    if (toDate) {
      documentConditions += ` AND issued_date <= $${paramIndex}`;
      templateConditions += ` AND created_at <= $${paramIndex}`;
      additionalParams.push(toDate);
      paramIndex++;
    }
    
    // Thêm điều kiện lọc theo ngôn ngữ
    if (language) {
      documentConditions += ` AND LOWER(language) = LOWER($${paramIndex})`;
      templateConditions += ` AND LOWER(language) = LOWER($${paramIndex})`;
      additionalParams.push(language);
      paramIndex++;
    }
    
    // Truy vấn UNION để kết hợp kết quả từ cả văn bản pháp luật và mẫu văn bản
    // Sử dụng ORDER BY CASE để ưu tiên các kết quả khớp chính xác
    const query = `
      WITH combined_results AS (
        (
          SELECT 
            id, 
            title, 
            document_type as type,
            summary,
            issued_date as date,
            'legal_document' as result_type,
            CASE 
              WHEN LOWER(title) = LOWER($2) THEN 1      -- Ưu tiên cao nhất cho khớp hoàn toàn
              WHEN LOWER(title) LIKE LOWER($3) THEN 2   -- Ưu tiên thứ 2 cho khớp đầu tiêu đề
              WHEN LOWER(title) LIKE LOWER($1) THEN 3   -- Ưu tiên thứ 3 cho chứa trong tiêu đề
              ELSE 4                                     -- Ưu tiên thấp nhất cho khớp nội dung hoặc tóm tắt
            END as match_priority
          FROM LegalDocuments
          WHERE (${documentConditions})
        )
        
        UNION
        
        (
          SELECT 
            id,
            title,
            template_type as type,
            content as summary,
            created_at as date,
            'template' as result_type,
            CASE 
              WHEN LOWER(title) = LOWER($2) THEN 1      -- Ưu tiên cao nhất cho khớp hoàn toàn
              WHEN LOWER(title) LIKE LOWER($3) THEN 2   -- Ưu tiên thứ 2 cho khớp đầu tiêu đề
              WHEN LOWER(title) LIKE LOWER($1) THEN 3   -- Ưu tiên thứ 3 cho chứa trong tiêu đề
              ELSE 4                                     -- Ưu tiên thấp nhất cho khớp nội dung
            END as match_priority
          FROM DocumentTemplates
          WHERE (${templateConditions})
        )
      )
      
      SELECT id, title, type, summary, date, result_type
      FROM combined_results
      ORDER BY match_priority ASC, date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const queryParams = [...searchQueries, ...additionalParams, limit, offset];
    
    // Truy vấn đếm tổng số kết quả
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        (
          SELECT id
          FROM LegalDocuments
          WHERE (${documentConditions})
        )
        
        UNION
        
        (
          SELECT id
          FROM DocumentTemplates
          WHERE (${templateConditions})
        )
      ) as count_results
    `;
    
    // Thực thi truy vấn
    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, [...searchQueries, ...additionalParams])
    ]);

    const total = parseInt(countResult.rows[0].total);
    
    return {
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo văn bản pháp luật mới
 * @param {Object} documentData - Dữ liệu văn bản
 * @returns {Promise<Object>} Văn bản mới tạo
 */
const createLegalDocument = async (documentData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      title,
      document_type,
      version,
      content,
      summary,
      issued_date,
      language,
      keywords = []
    } = documentData;
    
    // Thêm văn bản mới
    const documentQuery = `
      INSERT INTO LegalDocuments(
        title,
        document_type,
        version,
        content,
        summary,
        issued_date,
        language
      )
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const documentValues = [
      title,
      document_type,
      version,
      content,
      summary,
      issued_date,
      language
    ];
    
    const documentResult = await client.query(documentQuery, documentValues);
    const newDocument = documentResult.rows[0];
    
    // Thêm các từ khóa nếu có
    if (keywords && keywords.length > 0) {
      // Loại bỏ các từ khóa trùng lặp và khoảng trắng
      const uniqueKeywords = [...new Set(keywords)].filter(keyword => keyword.trim());
      
      if (uniqueKeywords.length > 0) {
        const keywordQuery = `
          INSERT INTO LegalKeywords(document_id, keyword)
          VALUES($1, $2)
        `;
        
        for (const keyword of uniqueKeywords) {
          await client.query(keywordQuery, [newDocument.id, keyword.trim()]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Thêm từ khóa đã xử lý vào dữ liệu trả về
    newDocument.keywords = keywords && keywords.length > 0 
      ? [...new Set(keywords)].filter(keyword => keyword.trim()).map(keyword => keyword.trim()) 
      : [];
    
    return newDocument;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cập nhật văn bản pháp luật
 * @param {number|string} documentId - ID văn bản
 * @param {Object} documentData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Văn bản đã cập nhật
 */
const updateLegalDocument = async (documentId, documentData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      title,
      document_type,
      version,
      content,
      summary,
      issued_date,
      language,
      keywords = []
    } = documentData;
    
    // Cập nhật văn bản
    const documentQuery = `
      UPDATE LegalDocuments
      SET
        title = $1,
        document_type = $2,
        version = $3,
        content = $4,
        summary = $5,
        issued_date = $6,
        language = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const documentValues = [
      title,
      document_type,
      version,
      content,
      summary,
      issued_date,
      language,
      documentId
    ];
    
    const documentResult = await client.query(documentQuery, documentValues);
    
    if (documentResult.rows.length === 0) {
      throw new Error(`Không tìm thấy văn bản có ID ${documentId}`);
    }
    
    const updatedDocument = documentResult.rows[0];
    
    // Xóa từ khóa cũ
    await client.query('DELETE FROM LegalKeywords WHERE document_id = $1', [documentId]);
    
    // Thêm từ khóa mới nếu có
    if (keywords && keywords.length > 0) {
      // Loại bỏ các từ khóa trùng lặp
      const uniqueKeywords = [...new Set(keywords)].filter(keyword => keyword.trim());
      
      if (uniqueKeywords.length > 0) {
        const keywordQuery = `
          INSERT INTO LegalKeywords(document_id, keyword)
          VALUES($1, $2)
        `;
        
        for (const keyword of uniqueKeywords) {
          await client.query(keywordQuery, [documentId, keyword.trim()]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Thêm từ khóa vào dữ liệu trả về để hiển thị ngay cho người dùng
    updatedDocument.keywords = keywords && keywords.length > 0 
      ? [...new Set(keywords)].filter(keyword => keyword.trim()).map(keyword => keyword.trim()) 
      : [];
    
    return updatedDocument;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Xóa văn bản pháp luật
 * @param {number|string} documentId - ID văn bản
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteLegalDocument = async (documentId) => {
  try {
    // Xóa văn bản (các từ khóa sẽ bị xóa theo do ràng buộc ON DELETE CASCADE)
    const result = await pool.query(
      'DELETE FROM LegalDocuments WHERE id = $1 RETURNING id',
      [documentId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo mẫu văn bản mới
 * @param {Object} templateData - Dữ liệu mẫu văn bản
 * @returns {Promise<Object>} Mẫu văn bản mới tạo
 */
const createDocumentTemplate = async (templateData) => {
  try {
    const {
      title,
      template_type,
      content,
      language
    } = templateData;
    
    const query = `
      INSERT INTO DocumentTemplates(
        title,
        template_type,
        content,
        language
      )
      VALUES($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [title, template_type, content, language];
    
    const result = await pool.query(query, values);
    const newTemplate = result.rows[0];
    
    return newTemplate;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật mẫu văn bản
 * @param {number|string} templateId - ID mẫu văn bản
 * @param {Object} templateData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Mẫu văn bản đã cập nhật
 */
const updateDocumentTemplate = async (templateId, templateData) => {
  try {
    const {
      title,
      template_type,
      content,
      language
    } = templateData;
    
    const query = `
      UPDATE DocumentTemplates
      SET
        title = $1,
        template_type = $2,
        content = $3,
        language = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [title, template_type, content, language, templateId];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`Không tìm thấy mẫu văn bản có ID ${templateId}`);
    }
    
    const updatedTemplate = result.rows[0];
    
    return updatedTemplate;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa mẫu văn bản
 * @param {number|string} templateId - ID mẫu văn bản
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteDocumentTemplate = async (templateId) => {
  try {
    const result = await pool.query(
      'DELETE FROM DocumentTemplates WHERE id = $1 RETURNING id',
      [templateId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllLegalDocuments,
  getLegalDocumentById,
  getDocumentTypes,
  getIssuingBodies,
  getLegalFields,
  getEffectStatus,
  getDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate
}; 