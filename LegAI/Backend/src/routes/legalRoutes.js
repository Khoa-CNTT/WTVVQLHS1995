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

/**
 * @route  POST /api/legal/compare
 * @desc   So sánh hai văn bản pháp luật và phân tích sự khác biệt
 * @access Public
 */
router.post('/compare', async (req, res) => {
  try {
    const { currentContent, previousContent } = req.body;
    
    if (!currentContent || !previousContent) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu nội dung văn bản để so sánh'
      });
    }
    
    // Chuyển đổi nội dung HTML thành text thuần túy để so sánh chính xác
    const stripHtml = (html) => {
      // Giữ lại các thẻ đặc biệt như <p>, <br>, <ul>, <li>, <ol>, <div>
      // nhưng loại bỏ các thẻ khác
      return html
        .replace(/<(?!\/?(p|br|div|ul|ol|li)( [^>]*)?>) [^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Chuẩn hóa nội dung cho việc so sánh
    const normalizeForComparison = (content) => {
      return content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p>/gi, '\n\n')
        .replace(/<\/?[^>]+(>|$)/g, ''); // Loại bỏ tất cả HTML tags
    };
    
    // Nội dung chuẩn hóa để so sánh
    const normalizedCurrent = normalizeForComparison(currentContent);
    const normalizedPrevious = normalizeForComparison(previousContent);
    
    // Phân tích sự khác biệt
    const analyze = (text1, text2, rawText1, rawText2) => {
      // Chuẩn hóa và chia văn bản thành các đoạn
      const normalizeText = (text) => {
        return text.replace(/\r\n/g, '\n').split(/\n{2,}/).filter(p => p.trim());
      };
      
      const currentParagraphs = normalizeText(text1);
      const previousParagraphs = normalizeText(text2);
      
      // Map để giữ liên kết giữa text thuần túy và HTML gốc
      const currentRawParagraphs = normalizeText(rawText1);
      const previousRawParagraphs = normalizeText(rawText2);
      
      // Tìm các đoạn thêm mới
      const additions = [];
      currentParagraphs.forEach((paragraph, index) => {
        if (!previousParagraphs.some(p => p.includes(paragraph.substring(0, paragraph.length * 0.7)))) {
          // Lấy HTML gốc nếu có
          const htmlContent = currentRawParagraphs[index] || paragraph;
          additions.push({
            content: htmlContent,
            location: `Đoạn ${index + 1}`
          });
        }
      });
      
      // Tìm các đoạn đã xóa
      const deletions = [];
      previousParagraphs.forEach((paragraph, index) => {
        if (!currentParagraphs.some(p => p.includes(paragraph.substring(0, paragraph.length * 0.7)))) {
          // Lấy HTML gốc nếu có
          const htmlContent = previousRawParagraphs[index] || paragraph;
          deletions.push({
            content: htmlContent,
            location: `Đoạn ${index + 1} (trong văn bản cũ)`
          });
        }
      });
      
      // Tìm các đoạn bị sửa đổi
      const modifications = [];
      currentParagraphs.forEach((currentPara, cIndex) => {
        previousParagraphs.forEach((prevPara, pIndex) => {
          // Kiểm tra nếu đoạn có độ tương đồng cao nhưng không giống hoàn toàn
          const similarityScore = (s1, s2) => {
            const longer = s1.length > s2.length ? s1 : s2;
            const shorter = s1.length > s2.length ? s2 : s1;
            if (longer.length === 0) return 1.0;
            return (longer.length - editDistance(longer, shorter)) / longer.length;
          };
          
          const editDistance = (s1, s2) => {
            const a = s1.toLowerCase();
            const b = s2.toLowerCase();
            const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
            
            for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
            for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
            
            for (let i = 1; i <= a.length; i++) {
              for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                  matrix[i - 1][j] + 1,      // deletion
                  matrix[i][j - 1] + 1,      // insertion
                  matrix[i - 1][j - 1] + cost  // substitution
                );
              }
            }
            
            return matrix[a.length][b.length];
          };
          
          const similarity = similarityScore(currentPara, prevPara);
          
          // Nếu đoạn tương tự nhưng không giống hoàn toàn (độ tương đồng từ 0.7 đến 0.95)
          if (similarity > 0.7 && similarity < 0.95) {
            // Lấy HTML gốc nếu có
            const oldHtmlContent = previousRawParagraphs[pIndex] || prevPara;
            const newHtmlContent = currentRawParagraphs[cIndex] || currentPara;
            
            modifications.push({
              oldContent: oldHtmlContent,
              newContent: newHtmlContent,
              location: `Đoạn ${cIndex + 1} (hiện tại) / Đoạn ${pIndex + 1} (cũ)`
            });
          }
        });
      });
      
      // Tạo tóm tắt
      const summary = `<p>Phân tích văn bản với độ chính xác cao đã tìm thấy:</p>
      <ul>
        <li><strong>${additions.length}</strong> phần thêm mới</li>
        <li><strong>${deletions.length}</strong> phần đã xóa</li>
        <li><strong>${modifications.length}</strong> phần được sửa đổi</li>
      </ul>`;
      
      return {
        additions,
        deletions,
        modifications,
        summary
      };
    };
    
    const result = analyze(normalizedCurrent, normalizedPrevious, currentContent, previousContent);
    
    res.json({
      status: 'success',
      data: result
    });
    
  } catch (error) {
    console.error('Lỗi khi so sánh văn bản:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server khi so sánh văn bản'
    });
  }
});

/**
 * @route  GET /api/legal/documents/:id/similar
 * @desc   Lấy danh sách các văn bản tương tự (phiên bản cũ hoặc tương tự) dựa vào issued_date và nội dung
 * @access Public
 */
router.get('/documents/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    const pool = require('../config/database');
    
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
    
    // Tính độ tương đồng giữa hai chuỗi
    const calculateTitleSimilarity = (title1, title2) => {
      if (!title1 || !title2) return 0;
      
      // Chuẩn hóa tiêu đề
      const normalize = (title) => {
        return title.toLowerCase()
                  .replace(/[.,(){}[\]\/\-:;]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
      };
      
      const normalizedTitle1 = normalize(title1);
      const normalizedTitle2 = normalize(title2);
      
      // Tách thành các từ
      const words1 = normalizedTitle1.split(' ');
      const words2 = normalizedTitle2.split(' ');
      
      // Đếm số từ trùng
      let matchingWords = 0;
      
      words1.forEach(w1 => {
        if (words2.includes(w1)) {
          matchingWords++;
        }
      });
      
      // Tính tỷ lệ % số từ trùng trên tổng số từ
      const matchPercent = (matchingWords / Math.max(words1.length, words2.length)) * 100;
      
      return Math.round(matchPercent);
    };
    
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
    // Lấy tất cả văn bản, sau đó lọc theo độ tương đồng của tiêu đề trong JS
    const similarTitleQuery = `
      SELECT id, title, document_type, issued_date, document_number, content
      FROM LegalDocuments
      WHERE id != $1 AND id != ALL($2::int[])
      ORDER BY issued_date DESC
      LIMIT 100
    `;
    
    const similarTitleResult = await pool.query(
      similarTitleQuery, 
      [id, olderVersions.map(doc => doc.id)]
    );
    
    // Lọc văn bản có độ tương đồng tiêu đề >= 50%
    const similarTitleDocs = similarTitleResult.rows
      .map(doc => {
        const similarity = calculateTitleSimilarity(currentDocument.title, doc.title);
        return { ...doc, titleSimilarity: similarity };
      })
      .filter(doc => doc.titleSimilarity >= 50)
      .sort((a, b) => b.titleSimilarity - a.titleSimilarity)
      .slice(0, parseInt(limit));
    
    // Kết hợp kết quả và thêm trường similarity_score
    const combinedResults = [
      ...olderVersions.map(doc => ({
        ...doc,
        similarity_type: 'older_version',
        similarity_score: 90, // Văn bản cũ hơn được xem là rất tương tự
        titleSimilarity: calculateTitleSimilarity(currentDocument.title, doc.title)
      })),
      ...similarTitleDocs.map(doc => ({
        ...doc,
        similarity_type: 'similar_title',
        similarity_score: Math.max(doc.titleSimilarity, 70) // Điểm tương đồng dựa vào % tiêu đề khớp
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