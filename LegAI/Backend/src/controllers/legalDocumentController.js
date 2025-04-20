const legalDocumentModel = require('../models/legalDocumentModel');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Tìm kiếm văn bản pháp luật
 * @route   GET /api/legal/documents
 * @access  Public
 */
const getAllLegalDocuments = asyncHandler(async (req, res) => {
  const { 
    q = '', 
    type = '', 
    fromDate = null, 
    toDate = null, 
    page = 1, 
    limit = 10 
  } = req.query;

  console.log('Nhận yêu cầu tìm kiếm với tham số:', { 
    q, type, fromDate, toDate, page, limit 
  });

  const results = await legalDocumentModel.getAllLegalDocuments({
    searchTerm: q,
    documentType: type,
    fromDate: fromDate ? new Date(fromDate) : null,
    toDate: toDate ? new Date(toDate) : null,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    status: 'success',
    data: results.documents,
    pagination: results.pagination
  });
});

/**
 * @desc    Lấy chi tiết văn bản pháp luật
 * @route   GET /api/legal/documents/:id
 * @access  Public
 */
const getLegalDocumentById = asyncHandler(async (req, res) => {
  try {
    console.log('Controller nhận request với ID:', req.params.id);
    
    const document = await legalDocumentModel.getLegalDocumentById(req.params.id);

    if (!document) {
      console.log('Controller: Không tìm thấy văn bản với ID:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy văn bản pháp luật'
      });
    }

    console.log('Controller: Đã tìm thấy văn bản, trả về response');
    res.status(200).json({
      status: 'success',
      data: document
    });
  } catch (error) {
    console.error('Controller: Lỗi khi lấy văn bản pháp luật:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy văn bản pháp luật',
      error: error.message
    });
  }
});

/**
 * @desc    Lấy danh sách loại văn bản pháp luật
 * @route   GET /api/legal/document-types
 * @access  Public
 */
const getDocumentTypes = asyncHandler(async (req, res) => {
  const types = await legalDocumentModel.getDocumentTypes();

  res.status(200).json({
    status: 'success',
    data: types
  });
});

/**
 * @desc    Lấy danh sách cơ quan ban hành
 * @route   GET /api/legal/issuing-bodies
 * @access  Public
 */
const getIssuingBodies = asyncHandler(async (req, res) => {
  const issuingBodies = await legalDocumentModel.getExternalIssuingBodies();

  res.status(200).json({
    status: 'success',
    data: issuingBodies
  });
});

/**
 * @desc    Lấy danh sách lĩnh vực pháp luật
 * @route   GET /api/legal/fields
 * @access  Public
 */
const getLegalFields = asyncHandler(async (req, res) => {
  const fields = await legalDocumentModel.getExternalFields();

  res.status(200).json({
    status: 'success',
    data: fields
  });
});

/**
 * @desc    Lấy danh sách trạng thái hiệu lực
 * @route   GET /api/legal/effect-status
 * @access  Public
 */
const getEffectStatus = asyncHandler(async (req, res) => {
  const statuses = await legalDocumentModel.getExternalEffectStatus();

  res.status(200).json({
    status: 'success',
    data: statuses
  });
});

/**
 * @desc    Tìm kiếm mẫu văn bản
 * @route   GET /api/legal/templates
 * @access  Public
 */
const getDocumentTemplates = asyncHandler(async (req, res) => {
  const { 
    q = '', 
    type = '', 
    page = 1, 
    limit = 10 
  } = req.query;

  const results = await legalDocumentModel.getDocumentTemplates({
    searchTerm: q,
    templateType: type,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    status: 'success',
    data: results.templates,
    pagination: results.pagination
  });
});

/**
 * @desc    Lấy chi tiết mẫu văn bản
 * @route   GET /api/legal/templates/:id
 * @access  Public
 */
const getDocumentTemplateById = asyncHandler(async (req, res) => {
  const template = await legalDocumentModel.getDocumentTemplateById(req.params.id);

  if (!template) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy mẫu văn bản'
    });
  }

  res.status(200).json({
    status: 'success',
    data: template
  });
});

/**
 * @desc    Lấy danh sách loại mẫu văn bản
 * @route   GET /api/legal/template-types
 * @access  Public
 */
const getTemplateTypes = asyncHandler(async (req, res) => {
  const types = await legalDocumentModel.getTemplateTypes();

  res.status(200).json({
    status: 'success',
    data: types
  });
});

/**
 * @desc    Tìm kiếm tổng hợp (cả văn bản pháp luật và mẫu văn bản)
 * @route   GET /api/legal/search
 * @access  Public
 */
const searchAll = asyncHandler(async (req, res) => {
  const { 
    q = '', 
    type = '',
    fromDate = null,
    toDate = null,
    language = '',
    page = 1, 
    limit = 10 
  } = req.query;

  console.log('Nhận yêu cầu tìm kiếm tổng hợp với tham số:', { 
    q, type, fromDate, toDate, language, page, limit 
  });

  const results = await legalDocumentModel.searchAll({
    searchTerm: q,
    documentType: type,
    fromDate: fromDate ? new Date(fromDate) : null,
    toDate: toDate ? new Date(toDate) : null,
    language,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  // Đảm bảo trả về thông tin phân trang đầy đủ
  console.log('Trả về kết quả tìm kiếm với phân trang:', results.pagination);

  res.status(200).json({
    status: 'success',
    data: {
      legalDocuments: results.legalDocuments,
      documentTemplates: results.documentTemplates,
      totalDocuments: results.totalDocuments,
      totalTemplates: results.totalTemplates
    },
    pagination: results.pagination
  });
});

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