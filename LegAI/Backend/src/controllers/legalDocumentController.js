const LegalDocumentModel = require('../models/legalDocumentModel');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Lấy tất cả văn bản pháp luật
 * @route   GET /api/legal/documents
 * @access  Public
 */
const getAllLegalDocuments = asyncHandler(async (req, res) => {
  const { 
    search, 
    document_type, 
    from_date, 
    to_date, 
    page = 1, 
    limit = 10 
  } = req.query;

  const options = {
    searchTerm: search,
    documentType: document_type,
    fromDate: from_date,
    toDate: to_date,
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await LegalDocumentModel.getAllLegalDocuments(options);
  
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: result.pagination
  });
});

/**
 * @desc    Lấy chi tiết văn bản pháp luật
 * @route   GET /api/legal/documents/:id
 * @access  Public
 */
const getLegalDocumentById = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const document = await LegalDocumentModel.getLegalDocumentById(documentId);
  
  if (!document) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy văn bản pháp luật'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: document
  });
});

/**
 * @desc    Lấy các loại văn bản
 * @route   GET /api/legal/document-types
 * @access  Public
 */
const getDocumentTypes = asyncHandler(async (req, res) => {
  const types = await LegalDocumentModel.getDocumentTypes();
  
  res.status(200).json({
    status: 'success',
    data: types
  });
});

/**
 * @desc    Lấy danh sách mẫu văn bản
 * @route   GET /api/legal/templates
 * @access  Public
 */
const getDocumentTemplates = asyncHandler(async (req, res) => {
  const { 
    search, 
    template_type, 
    page = 1, 
    limit = 10 
  } = req.query;

  const options = {
    searchTerm: search,
    templateType: template_type,
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await LegalDocumentModel.getDocumentTemplates(options);
  
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: result.pagination
  });
});

/**
 * @desc    Lấy chi tiết mẫu văn bản
 * @route   GET /api/legal/templates/:id
 * @access  Public
 */
const getDocumentTemplateById = asyncHandler(async (req, res) => {
  const templateId = req.params.id;
  const template = await LegalDocumentModel.getDocumentTemplateById(templateId);
  
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
 * @desc    Lấy các loại mẫu văn bản
 * @route   GET /api/legal/template-types
 * @access  Public
 */
const getTemplateTypes = asyncHandler(async (req, res) => {
  const types = await LegalDocumentModel.getTemplateTypes();
  
  res.status(200).json({
    status: 'success',
    data: types
  });
});

/**
 * @desc    Tìm kiếm tổng hợp
 * @route   GET /api/legal/search
 * @access  Public
 */
const searchAll = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const options = {
    searchTerm: search,
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await LegalDocumentModel.searchAll(options);
  
  res.status(200).json({
    status: 'success',
    data: result.data,
    pagination: result.pagination
  });
});

/**
 * @desc    Lấy danh sách cơ quan ban hành
 * @route   GET /api/legal/issuing-bodies
 * @access  Public
 */
const getIssuingBodies = asyncHandler(async (req, res) => {
  const issuers = await LegalDocumentModel.getIssuingBodies();
  
  res.status(200).json({
    status: 'success',
    data: issuers
  });
});

/**
 * @desc    Lấy danh sách lĩnh vực pháp luật
 * @route   GET /api/legal/fields
 * @access  Public
 */
const getLegalFields = asyncHandler(async (req, res) => {
  const fields = await LegalDocumentModel.getLegalFields();
  
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
  const statuses = await LegalDocumentModel.getEffectStatus();
  
  res.status(200).json({
    status: 'success',
    data: statuses
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