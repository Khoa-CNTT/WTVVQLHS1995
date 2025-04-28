const asyncHandler = require('../middleware/async');
const nodeScraperService = require('../services/nodeScraperService');

// @desc    Chạy thu thập dữ liệu hợp đồng bằng Node.js
// @route   POST /api/node-scraper/contracts
// @access  Private/Admin
exports.scrapeContracts = asyncHandler(async (req, res, next) => {
  try {
    // Lấy giới hạn từ query params hoặc body
    const limit = req.body.limit || req.query.limit || 10;
    
    console.log(`Yêu cầu thu thập dữ liệu hợp đồng với giới hạn ${limit}...`);
    
    // Nếu không cần ngay dữ liệu, có thể trả về phản hồi ngay lập tức và chạy trong nền
    if (req.query.background === 'true' || req.body.background === true) {
      res.status(200).json({
        success: true,
        message: 'Đã bắt đầu quá trình thu thập dữ liệu hợp đồng. Quá trình này sẽ chạy trong nền.'
      });
      
      nodeScraperService.scrapeContractsWithNode(req.user.id, limit)
        .then(result => {
          console.log('Kết quả thu thập hợp đồng:', result.message);
        })
        .catch(error => {
          console.error('Lỗi khi thu thập hợp đồng:', error);
        });
    } else {
      // Nếu cần kết quả ngay lập tức
      const result = await nodeScraperService.scrapeContractsWithNode(req.user.id, limit);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          count: result.count,
          total: result.total
        }
      });
    }
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu hợp đồng:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thu thập dữ liệu hợp đồng'
    });
  }
});

// @desc    Chạy thu thập dữ liệu văn bản pháp luật bằng Node.js
// @route   POST /api/node-scraper/legal-documents
// @access  Private/Admin
exports.scrapeLegalDocuments = asyncHandler(async (req, res, next) => {
  try {
    // Lấy giới hạn từ query params hoặc body
    const limit = req.body.limit || req.query.limit || 10;
    
    console.log(`Yêu cầu thu thập dữ liệu văn bản pháp luật với giới hạn ${limit}...`);
    
    // Nếu không cần ngay dữ liệu, có thể trả về phản hồi ngay lập tức và chạy trong nền
    if (req.query.background === 'true' || req.body.background === true) {
      res.status(200).json({
        success: true,
        message: 'Đã bắt đầu quá trình thu thập dữ liệu văn bản pháp luật. Quá trình này sẽ chạy trong nền.'
      });
      
      nodeScraperService.scrapeLegalDocumentsWithNode(req.user.id, limit)
        .then(result => {
          console.log('Kết quả thu thập văn bản pháp luật:', result.message);
        })
        .catch(error => {
          console.error('Lỗi khi thu thập văn bản pháp luật:', error);
        });
    } else {
      // Nếu cần kết quả ngay lập tức
      const result = await nodeScraperService.scrapeLegalDocumentsWithNode(req.user.id, limit);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          count: result.count,
          total: result.total
        }
      });
    }
  } catch (error) {
    console.error('Lỗi khi thu thập dữ liệu văn bản pháp luật:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thu thập dữ liệu văn bản pháp luật'
    });
  }
});

// @desc    Kiểm tra trạng thái thu thập dữ liệu
// @route   GET /api/node-scraper/status
// @access  Private/Admin
exports.getScrapingStatus = asyncHandler(async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const status = await nodeScraperService.getScrapingStatus(limit);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái thu thập dữ liệu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái thu thập dữ liệu'
    });
  }
}); 