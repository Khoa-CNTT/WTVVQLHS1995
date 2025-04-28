const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
  getEffectStatus,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  uploadPdfDocument,
  downloadLegalDocument,
  downloadDocumentTemplate
} = require('../controllers/legalDocumentController');

// Route tìm kiếm tổng hợp
router.get('/search', searchAll);

// Routes văn bản pháp luật
router.get('/documents', getAllLegalDocuments);
router.get('/documents/:id', getLegalDocumentById);
router.get('/documents/:id/download', downloadLegalDocument);
router.get('/document-types', getDocumentTypes);

// Routes CRUD văn bản pháp luật (cần xác thực và quyền admin)
router.post('/documents', protect, authorize('admin'), createLegalDocument);
router.put('/documents/:id', protect, authorize('admin'), updateLegalDocument);
router.delete('/documents/:id', protect, authorize('admin'), deleteLegalDocument);

// Routes dữ liệu bổ sung cho văn bản pháp luật
router.get('/issuing-bodies', getIssuingBodies);
router.get('/fields', getLegalFields);
router.get('/effect-status', getEffectStatus);

// Routes mẫu văn bản
router.get('/templates', getDocumentTemplates);
router.get('/templates/:id', getDocumentTemplateById);
router.get('/templates/:id/download', downloadDocumentTemplate);
router.get('/template-types', getTemplateTypes);

// Routes CRUD mẫu văn bản (cần xác thực và quyền admin)
router.post('/templates', protect, authorize('admin'), createDocumentTemplate);
router.put('/templates/:id', protect, authorize('admin'), updateDocumentTemplate);
router.delete('/templates/:id', protect, authorize('admin'), deleteDocumentTemplate);

// Route upload file PDF
router.post('/upload-pdf', protect, authorize('admin'), uploadPdfDocument);

module.exports = router; 