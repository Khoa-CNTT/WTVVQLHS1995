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
  const document = await legalDocumentModel.getLegalDocumentById(req.params.id);

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
    page = 1, 
    limit = 10 
  } = req.query;

  const results = await legalDocumentModel.searchAll({
    searchTerm: q,
    page: parseInt(page),
    limit: parseInt(limit)
  });

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