const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/legalDocumentController');

// Route tìm kiếm tổng hợp
router.get('/search', searchAll);

// Routes văn bản pháp luật
router.get('/documents', getAllLegalDocuments);
router.get('/documents/:id', getLegalDocumentById);
router.get('/document-types', getDocumentTypes);

// Routes dữ liệu bổ sung cho văn bản pháp luật
router.get('/issuing-bodies', getIssuingBodies);
router.get('/fields', getLegalFields);
router.get('/effect-status', getEffectStatus);

// Routes mẫu văn bản
router.get('/templates', getDocumentTemplates);
router.get('/templates/:id', getDocumentTemplateById);
router.get('/template-types', getTemplateTypes);

module.exports = router; 