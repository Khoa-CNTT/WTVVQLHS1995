const express = require('express');
const router = express.Router();
const LegalDocumentModel = require('../models/legalDocumentModel');
const pool = require('../config/database');
const legalDocumentController = require('../controllers/legalDocumentController');
const { protect, authorize } = require('../middleware/auth');

// Route lấy danh sách văn bản pháp luật
router.get('/', async (req, res) => {
  try {
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

    const documents = await LegalDocumentModel.getAllLegalDocuments(options);
    res.json(documents);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách văn bản pháp luật:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách văn bản pháp luật' });
  }
});

// Route lấy chi tiết văn bản pháp luật
router.get('/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await LegalDocumentModel.getLegalDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Không tìm thấy văn bản pháp luật' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết văn bản pháp luật:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết văn bản pháp luật' });
  }
});

// Route lấy danh sách loại văn bản
router.get('/types/all', async (req, res) => {
  try {
    const types = await LegalDocumentModel.getDocumentTypes();
    res.json(types);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại văn bản:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách loại văn bản' });
  }
});

// Route lấy danh sách cơ quan ban hành
router.get('/issuers/all', async (req, res) => {
  try {
    const issuers = await LegalDocumentModel.getIssuingBodies();
    res.json(issuers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cơ quan ban hành:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách cơ quan ban hành' });
  }
});

// Route lấy danh sách lĩnh vực
router.get('/fields/all', async (req, res) => {
  try {
    const fields = await LegalDocumentModel.getLegalFields();
    res.json(fields);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lĩnh vực:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lĩnh vực' });
  }
});

// Route lấy danh sách trạng thái hiệu lực
router.get('/status/all', async (req, res) => {
  try {
    const statuses = await LegalDocumentModel.getEffectStatus();
    res.json(statuses);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách trạng thái hiệu lực:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách trạng thái hiệu lực' });
  }
});

// Route lấy danh sách mẫu văn bản
router.get('/templates/all', async (req, res) => {
  try {
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

    const templates = await LegalDocumentModel.getDocumentTemplates(options);
    res.json(templates);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách mẫu văn bản:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách mẫu văn bản' });
  }
});

// Route lấy chi tiết mẫu văn bản
router.get('/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await LegalDocumentModel.getDocumentTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu văn bản' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết mẫu văn bản:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết mẫu văn bản' });
  }
});

// Route lấy danh sách loại mẫu văn bản
router.get('/templates/types/all', async (req, res) => {
  try {
    const types = await LegalDocumentModel.getTemplateTypes();
    res.json(types);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách loại mẫu văn bản' });
  }
});

// Route tìm kiếm tổng hợp
router.get('/search/all', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const options = {
      searchTerm: search,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const results = await LegalDocumentModel.searchAll(options);
    res.json(results);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm' });
  }
});

// Route cho việc tải xuống văn bản pháp luật dưới dạng PDF
router.get('/documents/:id/download', legalDocumentController.downloadLegalDocument);

// Route cho việc tải xuống mẫu văn bản dưới dạng PDF
router.get('/templates/:id/download', legalDocumentController.downloadDocumentTemplate);

// Route cho việc chuyển đổi HTML thành PDF
router.post('/html-to-pdf', protect, legalDocumentController.convertHtmlToPdf);

/**
 * @route  GET /api/legal/documents/:id/similar
 * @desc   Lấy danh sách các văn bản tương tự (phiên bản cũ hoặc tương tự) dựa vào issued_date và nội dung
 * @access Public
 */
router.get('/documents/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    // Lấy thông tin về văn bản hiện tại
    const currentDocumentQuery = `
      SELECT id, title, document_type, issued_date, content 
      FROM LegalDocuments 
      WHERE id = $1
    `;
    const currentDocumentResult = await pool.query(currentDocumentQuery, [id]);
    
    if (currentDocumentResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy văn bản'
      });
    }
    
    const currentDocument = currentDocumentResult.rows[0];
    
    // Tìm các văn bản có cùng loại và cũ hơn
    let olderVersionsQuery = `
      SELECT id, title, document_type, issued_date, document_number, content
      FROM LegalDocuments
      WHERE document_type = $1 AND id != $2
    `;
    const queryParams = [currentDocument.document_type, id];
    
    // Nếu có ngày ban hành, tìm các văn bản cũ hơn
    if (currentDocument.issued_date) {
      olderVersionsQuery += ` AND issued_date < $3`;
      queryParams.push(currentDocument.issued_date);
    }
    
    olderVersionsQuery += ` ORDER BY issued_date DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(parseInt(limit));
    
    // Thực hiện truy vấn
    const olderVersionsResult = await pool.query(olderVersionsQuery, queryParams);
    const olderVersions = olderVersionsResult.rows;
    
    // Tìm các văn bản có tiêu đề tương tự
    const titleWords = currentDocument.title.split(/\s+/).slice(0, 3);
    const titlePattern = titleWords.join('|');
    
    const olderVersionIds = olderVersions.map(doc => doc.id);
    const similarTitleQuery = `
      SELECT id, title, document_type, issued_date, document_number, content
      FROM LegalDocuments
      WHERE id != $1 AND id != ALL($2::int[])
        AND title ~* $3
      ORDER BY issued_date DESC
      LIMIT $4
    `;
    
    const similarTitleResult = await pool.query(
      similarTitleQuery, 
      [id, olderVersionIds, titlePattern, parseInt(limit)]
    );
    
    const similarTitleDocs = similarTitleResult.rows;
    
    // Kết hợp kết quả và thêm trường similarity_score
    const combinedResults = [
      ...olderVersions.map(doc => ({
        ...doc,
        similarity_type: 'older_version',
        similarity_score: 90 // Văn bản cũ hơn được xem là rất tương tự
      })),
      ...similarTitleDocs.map(doc => ({
        ...doc,
        similarity_type: 'similar_title',
        similarity_score: 70 // Văn bản có tiêu đề tương tự
      }))
    ];
    
    return res.json({
      status: 'success',
      data: combinedResults
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy văn bản tương tự:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi lấy văn bản tương tự'
    });
  }
});

module.exports = router; 