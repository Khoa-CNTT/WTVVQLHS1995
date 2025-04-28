const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  scrapeContracts,
  scrapeLegalDocuments,
  getScrapingStatus
} = require('../controllers/nodeScraperController');

// Tất cả các routes đều yêu cầu xác thực và quyền admin
router.use(protect);
router.use(authorize('admin'));

// Routes thu thập dữ liệu
router.post('/contracts', scrapeContracts);
router.post('/legal-documents', scrapeLegalDocuments);
router.get('/status', getScrapingStatus);

module.exports = router; 