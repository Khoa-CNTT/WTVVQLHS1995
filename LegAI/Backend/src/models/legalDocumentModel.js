const pool = require('../config/database');
const axios = require('axios');

// API Endpoints 
const API_BASE_URL = 'https://vanbanphapluat.co/api';
const API_ENDPOINTS = {
  DOCUMENTS: '/vanban',
  DOCUMENT_TYPES: '/loai-van-ban',
  SEARCH: '/search',
  ISSUING_BODIES: '/coquanbanhanh',
  FIELDS: '/linhvuc',
  EFFECT_STATUS: '/tinhtranghieuluc'
};

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

    // Thử lấy từ API bên ngoài trước
    try {
      const externalResults = await searchExternalLegalDocuments(searchTerm, documentType, fromDate, toDate, page, limit);
      return externalResults;
    } catch (externalError) {
      console.error('Lỗi khi tìm kiếm từ API bên ngoài:', externalError);
      // Nếu API bên ngoài lỗi, sử dụng database nội bộ
    }

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
 * Tìm kiếm văn bản pháp luật từ API bên ngoài
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {string} documentType - Loại văn bản
 * @param {Date} fromDate - Từ ngày
 * @param {Date} toDate - Đến ngày
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số lượng kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
const searchExternalLegalDocuments = async (searchTerm, documentType, fromDate, toDate, page, limit) => {
  try {
    let apiUrl = `${API_BASE_URL}${API_ENDPOINTS.SEARCH}`;
    const queryParams = new URLSearchParams();
    
    // Luôn gửi tham số kwd ngay cả khi tìm kiếm rỗng
    queryParams.append('kwd', encodeURIComponent(searchTerm || ''));
    
    if (documentType) {
      queryParams.append('LoaiVanBanID', documentType);
    }
    
    // Thêm tham số từ ngày, đến ngày nếu có
    if (fromDate) {
      queryParams.append('fromDate', formatDateForAPI(fromDate));
    }
    
    if (toDate) {
      queryParams.append('toDate', formatDateForAPI(toDate));
    }
    
    // Thêm tham số phân trang
    queryParams.append('p', page);
    // Sử dụng tham số RowPerPage từ API bên ngoài để chỉ định số lượng kết quả trên một trang
    queryParams.append('RowPerPage', limit);
    
    // Gọi API
    const response = await axios.get(`${apiUrl}?${queryParams.toString()}`);
    
    // Xử lý kết quả từ API
    const items = response.data.Items || [];
    
    // Hàm chuẩn hóa độ dài văn bản
    const normalizeText = (text, maxLength = 100) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    
    // Chuyển đổi định dạng kết quả để phù hợp với hệ thống
    const documents = items.map(item => {
      // Chuẩn hóa tiêu đề để các văn bản hiển thị đồng đều
      let title = item.Title || item.TrichYeu || '';
      title = normalizeText(title, 120);
      
      // Chuẩn hóa tóm tắt
      let summary = item.TrichYeu || '';
      summary = normalizeText(summary, 200);
      
      // Chuẩn hóa tên cơ quan ban hành
      let issuer = '';
      if (Array.isArray(item.CoQuanBanHanh)) {
        issuer = item.CoQuanBanHanh.map(cq => cq.Title).join(', ');
        issuer = normalizeText(issuer, 80);
      }
      
      // Chuẩn hóa người ký
      let signer = '';
      if (Array.isArray(item.NguoiKy)) {
        signer = item.NguoiKy.map(nk => nk.Title).join(', ');
        signer = normalizeText(signer, 50);
      }
      
      // Chuyển đổi định dạng ngày tháng để đồng nhất
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          return date.toISOString();
        } catch (e) {
          return dateStr;
        }
      };
      
      return {
        id: item.UID,
        title: title,
        document_type: item.LoaiVanBan?.Title || '',
        document_number: item.SoHieu || '',
        issued_date: formatDate(item.NgayBanHanh),
        effective_date: formatDate(item.NgayHieuLuc),
        published_date: formatDate(item.NgayCongBao),
        issuer: issuer,
        signer: signer,
        status: item.TrinhTrangHieuLuc?.Title || '',
        summary: summary,
        content: '', // Nội dung chi tiết sẽ được lấy khi xem chi tiết
        fields: Array.isArray(item.LinhVuc) ? item.LinhVuc.map(lv => lv.Title).join(', ') : '',
        keywords: Array.isArray(item.LinhVuc) ? item.LinhVuc.map(lv => lv.Title) : [] // Sử dụng lĩnh vực làm từ khóa
      };
    });
    
    // Lấy thông tin phân trang từ API response
    const total = response.data.Option?.TotalRow || 0;
    const currentPage = response.data.Option?.CurrentPage || page;
    const rowPerPage = response.data.Option?.RowPerPage || limit;
    
    const pagination = {
      total: total,
      totalPages: Math.ceil(total / rowPerPage),
      currentPage: currentPage,
      limit: rowPerPage
    };
    
    return {
      documents,
      pagination
    };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm văn bản từ API bên ngoài:', error.message);
    // Trả về kết quả trống thay vì ném lỗi
    return {
      documents: [],
      pagination: {
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      }
    };
  }
};

/**
 * Định dạng ngày cho API bên ngoài
 * @param {Date|string} date - Đối tượng Date hoặc chuỗi ngày cần định dạng
 * @returns {string} Chuỗi ngày theo định dạng yyyy-MM-dd
 */
const formatDateForAPI = (date) => {
  if (!date) return '';
  
  // Xử lý trường hợp date là chuỗi
  if (typeof date === 'string') {
    try {
      date = new Date(date);
    } catch (e) {
      console.error('Lỗi chuyển đổi chuỗi ngày:', e);
      return '';
    }
  }
  
  // Kiểm tra date có phải là đối tượng Date hợp lệ không
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Lấy thông tin chi tiết một văn bản pháp luật
 * @param {number|string} documentId - ID của văn bản
 * @returns {Promise<Object>} Thông tin văn bản
 */
const getLegalDocumentById = async (documentId) => {
  try {
    console.log('Bắt đầu lấy văn bản với ID:', documentId);
    
    // Kiểm tra xem documentId có phải là UID từ API bên ngoài hay không
    if (typeof documentId === 'string') {
      // Loại bỏ dấu / ở đầu nếu có
      let normalizedId = documentId.startsWith('/') ? documentId.substring(1) : documentId;
      
      // Xem xét các trường hợp của UID
      // 1. Định dạng nghi-dinh-63-2010-nd-cp-kiem-soat-thu-tuc-hanh-chinh
      // 2. Định dạng decree-53-2018-nd-cp-the-exportation-or-importation...
      // 3. Định dạng luat-thue-thu-nhap-doanh-nghiep
      if (/^decree-|^nghi-dinh-|^quyet-dinh-|^thong-tu-|^luat-|^van-ban-/.test(normalizedId)) {
        console.log('Đang lấy văn bản từ API bên ngoài với ID (có định dạng đặc biệt):', normalizedId);
        try {
          const externalDocument = await getExternalLegalDocumentById(normalizedId);
          if (externalDocument) {
            return externalDocument;
          } else {
            console.log('Không tìm được văn bản với định dạng đặc biệt, đang thử phương thức khác');
          }
        } catch (err) {
          console.error('Lỗi khi lấy văn bản với định dạng đặc biệt:', err.message);
        }
      }
      
      // Nếu ID có dạng đường dẫn như /decree-53-2018-nd-cp... hoặc path/to/document
      // thử lấy từ API bên ngoài dưới dạng URL thông thường
      try {
        console.log('Thử lấy văn bản từ API bên ngoài với ID thông thường:', normalizedId);
        const externalDocument = await getExternalLegalDocumentById(normalizedId);
        if (externalDocument) {
          return externalDocument;
        } else {
          console.log('Không tìm được văn bản với ID thông thường từ API bên ngoài');
        }
      } catch (externalError) {
        console.error('Lỗi khi lấy chi tiết văn bản từ API bên ngoài:', externalError.message);
      }
    }
    
    // Nếu ID là số hoặc không lấy được từ API bên ngoài, lấy từ database nội bộ
    if (!isNaN(parseInt(documentId))) {
      console.log('Đang lấy văn bản từ database nội bộ với ID số:', documentId);
      const result = await pool.query(
        'SELECT * FROM LegalDocuments WHERE id = $1',
        [documentId]
      );
      
      if (result.rows.length > 0) {
        // Lấy các từ khóa liên quan
        const keywordsResult = await pool.query(
          'SELECT keyword FROM LegalKeywords WHERE document_id = $1',
          [documentId]
        );
        
        const document = result.rows[0];
        document.keywords = keywordsResult.rows.map(row => row.keyword);
        
        console.log('Đã tìm thấy văn bản trong database nội bộ:', document.title);
        return document;
      } else {
        console.log('Không tìm thấy văn bản trong database nội bộ với ID:', documentId);
      }
    } else {
      console.log('ID không phải là số, không thể truy vấn trong database nội bộ:', documentId);
    }
    
    console.log('Không tìm thấy văn bản trong cả API bên ngoài và database nội bộ');
    return null;
  } catch (error) {
    console.error('Lỗi trong quá trình lấy văn bản:', error.message);
    throw error;
  }
};

/**
 * Lấy chi tiết văn bản pháp luật từ API bên ngoài
 * @param {string} uid - UID của văn bản
 * @returns {Promise<Object>} Thông tin chi tiết văn bản
 */
const getExternalLegalDocumentById = async (uid) => {
  try {
    console.log('Lấy chi tiết văn bản từ API bên ngoài với UID:', uid);
    
    // Xử lý đặc biệt cho ID dạng URL
    // Loại bỏ dấu "/" ở đầu nếu có
    let normalizedUid = uid;
    if (normalizedUid.startsWith('/')) {
      normalizedUid = normalizedUid.substring(1);
    }
    
    // Xử lý trường hợp slug có dạng luat-xxx hoặc decree-xxx
    if (/^luat-|^nghi-dinh-|^quyet-dinh-|^thong-tu-|^decree-/.test(normalizedUid)) {
      console.log('ID có định dạng đặc biệt, dạng:', normalizedUid);
    }
    
    // Gọi trực tiếp tới API để lấy dữ liệu
    console.log(`Đang gọi API với URL: ${API_BASE_URL}/vanban/${normalizedUid}`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/vanban/${normalizedUid}`);
      
      if (!response.data || !response.data.SoHieu) {
        console.log('Không tìm thấy dữ liệu văn bản từ API bên ngoài');
        console.log('Dữ liệu trả về:', JSON.stringify(response.data, null, 2));
        return null;
      }
      
      console.log('Đã nhận được dữ liệu từ API');
      
      const document = {
        id: normalizedUid, // Sử dụng normalizedUid làm ID
        title: response.data.TrichYeu || response.data.Title || 'Không có tiêu đề',
        document_type: response.data.LoaiVanBan?.Title || 'Không xác định',
        content: response.data.ToanVan || 'Không có nội dung',
        summary: response.data.TrichYeu || 'Không có trích yếu',
        issued_date: formatDateForAPI(response.data.NgayBanHanh) || null,
        effective_date: formatDateForAPI(response.data.NgayHieuLuc) || null,
        published_date: formatDateForAPI(response.data.NgayCongBao) || null,
        document_number: response.data.SoHieu || 'Không có số hiệu',
        document_symbol: response.data.SoHieu || '',
        issuing_body: response.data.CoQuanBanHanh?.[0]?.Title || 'Không xác định',
        signer: response.data.NguoiKy?.[0]?.Title || 'Không xác định',
        status: response.data.TrinhTrangHieuLuc?.Title || 'Không xác định',
        field: response.data.LinhVuc?.[0]?.Title || 'Không xác định',
        language: response.data.IsEn ? 'en' : 'vi',
        is_external: true, // Đánh dấu đây là văn bản từ API bên ngoài
        external_uid: normalizedUid,
        doc_url: response.data.DOCUrl || '',
        pdf_url: response.data.PDFUrl || '',
        doc_size: response.data.DOCSize || 0,
        pdf_size: response.data.PDFSize || 0,
        poster_url: response.data.Poster || '',
        updated_at: formatDateForAPI(response.data.Updated) || null
      };
      
      console.log('Đã lấy được chi tiết văn bản từ API bên ngoài:', document.title);
      
      return document;
    } catch (apiError) {
      console.error('Lỗi khi gọi API với URL:', apiError.message);
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết văn bản từ API bên ngoài:', error.message);
    if (error.response) {
      console.error('Mã lỗi:', error.response.status);
      console.error('Dữ liệu lỗi:', error.response.data);
    }
    return null; // Thay vì throw error, trả về null để xử lý ở phía trên
  }
};

/**
 * Lấy các loại văn bản pháp luật
 * @returns {Promise<Array>} Danh sách loại văn bản
 */
const getDocumentTypes = async () => {
  try {
    // Thử lấy từ API bên ngoài
    try {
      const externalTypes = await getExternalDocumentTypes();
      return externalTypes;
    } catch (externalError) {
      console.error('Lỗi khi lấy loại văn bản từ API bên ngoài:', externalError);
      // Nếu API bên ngoài lỗi, sử dụng database nội bộ
    }
    
    // Lấy từ database nội bộ
    const result = await pool.query(
      'SELECT DISTINCT document_type FROM LegalDocuments ORDER BY document_type'
    );
    return result.rows.map(row => row.document_type);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách loại văn bản pháp luật từ API bên ngoài
 * @returns {Promise<Array>} Danh sách loại văn bản
 */
const getExternalDocumentTypes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENT_TYPES}`);
    
    // Xử lý kết quả và trả về danh sách loại văn bản
    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item.UID,
        name: item.Title
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy loại văn bản từ API bên ngoài:', error);
    throw error;
  }
};

/**
 * Lấy danh sách cơ quan ban hành từ API bên ngoài
 * @returns {Promise<Array>} Danh sách cơ quan ban hành
 */
const getExternalIssuingBodies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.ISSUING_BODIES}`);
    
    // Xử lý kết quả và trả về danh sách cơ quan ban hành
    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item.UID,
        name: item.Title
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy cơ quan ban hành từ API bên ngoài:', error);
    throw error;
  }
};

/**
 * Lấy danh sách lĩnh vực từ API bên ngoài
 * @returns {Promise<Array>} Danh sách lĩnh vực
 */
const getExternalFields = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.FIELDS}`);
    
    // Xử lý kết quả và trả về danh sách lĩnh vực
    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item.UID,
        name: item.Title
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy lĩnh vực từ API bên ngoài:', error);
    throw error;
  }
};

/**
 * Lấy danh sách trạng thái hiệu lực từ API bên ngoài
 * @returns {Promise<Array>} Danh sách trạng thái hiệu lực
 */
const getExternalEffectStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.EFFECT_STATUS}`);
    
    // Xử lý kết quả và trả về danh sách trạng thái hiệu lực
    if (Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item.UID,
        name: item.Title
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái hiệu lực từ API bên ngoài:', error);
    throw error;
  }
};

/**
 * Tìm kiếm mẫu văn bản
 * @param {Object} options - Các tùy chọn tìm kiếm
 * @param {string} options.searchTerm - Từ khóa tìm kiếm
 * @param {string} options.templateType - Loại mẫu văn bản
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số lượng kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
const getDocumentTemplates = async (options = {}) => {
  try {
    const {
      searchTerm = '',
      templateType = '',
      page = 1,
      limit = 10
    } = options;

    // Xây dựng truy vấn
    let query = `
      SELECT * FROM DocumentTemplates
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Thêm điều kiện tìm kiếm theo từ khóa
    if (searchTerm) {
      query += ` AND (
        title ILIKE $${paramIndex} 
        OR content ILIKE $${paramIndex} 
        OR description ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Thêm điều kiện tìm kiếm theo loại mẫu văn bản
    if (templateType) {
      query += ` AND template_type = $${paramIndex}`;
      queryParams.push(templateType);
      paramIndex++;
    }

    // Thêm phân trang
    const offset = (page - 1) * limit;
    
    // Đếm tổng số bản ghi
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, queryParams);
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    return {
      templates: result.rows,
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
 * Lấy chi tiết mẫu văn bản
 * @param {number} templateId - ID của mẫu văn bản
 * @returns {Promise<Object>} Thông tin mẫu văn bản
 */
const getDocumentTemplateById = async (templateId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM DocumentTemplates WHERE id = $1',
      [templateId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy các loại mẫu văn bản
 * @returns {Promise<Array>} Danh sách loại mẫu văn bản
 */
const getTemplateTypes = async () => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT template_type FROM DocumentTemplates ORDER BY template_type'
    );
    return result.rows.map(row => row.template_type);
  } catch (error) {
    throw error;
  }
};

/**
 * Tìm kiếm tổng hợp (cả văn bản pháp luật và mẫu văn bản)
 * @param {Object} options - Các tùy chọn tìm kiếm
 * @param {string} options.searchTerm - Từ khóa tìm kiếm
 * @param {string} options.documentType - Loại văn bản
 * @param {Date} options.fromDate - Từ ngày
 * @param {Date} options.toDate - Đến ngày
 * @param {string} options.language - Ngôn ngữ mẫu văn bản
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số lượng kết quả mỗi trang
 * @returns {Promise<Object>} Kết quả tìm kiếm
 */
const searchAll = async (options = {}) => {
  try {
    const {
      searchTerm = '',
      documentType = '',
      fromDate = null,
      toDate = null,
      language = '',
      page = 1,
      limit = 10
    } = options;

    console.log(`Thực hiện tìm kiếm tổng hợp với từ khóa: "${searchTerm}", loại: "${documentType}"`);

    // Lấy danh sách văn bản pháp luật từ API bên ngoài
    const legalDocumentResults = await searchExternalLegalDocuments(
      searchTerm,
      documentType,
      fromDate,
      toDate,
      page,
      limit
    );

    // Lấy danh sách mẫu văn bản từ CSDL nội bộ với bộ lọc ngôn ngữ
    const templateResults = await getDocumentTemplates({
      searchTerm,
      templateType: '', // Không lọc theo loại mẫu văn bản cụ thể
      language, // Thêm tham số lọc theo ngôn ngữ
      page,
      limit
    });

    // Tính toán số trang tổng cộng dựa trên tổng số kết quả và limit
    const totalItems = (legalDocumentResults.pagination?.total || 0) + 
                      (templateResults.pagination?.total || 0);
    const totalPages = Math.ceil(totalItems / limit);

    console.log('Kết quả tìm kiếm pháp luật:', legalDocumentResults.documents?.length);
    console.log('Kết quả tìm kiếm mẫu văn bản:', templateResults.templates?.length);
    console.log('Tổng số kết quả:', totalItems);
    console.log('Tổng số trang:', totalPages);

    return {
      legalDocuments: legalDocumentResults.documents || [],
      documentTemplates: templateResults.templates || [],
      totalDocuments: legalDocumentResults.pagination?.total || 0,
      totalTemplates: templateResults.pagination?.total || 0,
      pagination: {
        total: totalItems,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalPages: totalPages
      }
    };
  } catch (error) {
    console.error('Lỗi khi thực hiện tìm kiếm tổng hợp:', error.message);
    // Trả về kết quả trống thay vì ném lỗi
    return {
      legalDocuments: [],
      documentTemplates: [],
      totalDocuments: 0,
      totalTemplates: 0,
      pagination: {
        total: 0,
        currentPage: parseInt(options.page) || 1,
        limit: parseInt(options.limit) || 10,
        totalPages: 0
      }
    };
  }
};

module.exports = {
  getAllLegalDocuments,
  getLegalDocumentById,
  getDocumentTypes,
  getDocumentTemplates,
  getDocumentTemplateById,
  getTemplateTypes,
  searchAll,
  getExternalIssuingBodies,
  getExternalFields,
  getExternalEffectStatus
}; 