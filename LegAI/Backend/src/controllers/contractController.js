const fs = require('fs');
const path = require('path');
const contractModel = require('../models/contractModel');
const asyncHandler = require('../middleware/async');

// @desc    Lấy danh sách hợp đồng của người dùng hiện tại
// @route   GET /api/contracts
// @access  Private
const getContracts = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await contractModel.getContracts(userId, page, limit);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hợp đồng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hợp đồng'
    });
  }
});

// @desc    Lấy tất cả hợp đồng (chỉ dành cho admin)
// @route   GET /api/contracts/all
// @access  Private/Admin
const getAllContracts = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';
    const userId = req.query.userId || null;
    
    const result = await contractModel.getAllContracts(page, limit, searchTerm, userId);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Lỗi khi lấy tất cả hợp đồng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tất cả hợp đồng'
    });
  }
});

// @desc    Lấy chi tiết hợp đồng theo ID
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const contractId = req.params.id;
    
    // Kiểm tra nếu là admin thì không cần kiểm tra quyền
    const isAdmin = req.user.role === 'admin';
    
    const contract = await contractModel.getContractById(contractId, isAdmin ? null : userId);
    
    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết hợp đồng ID ${req.params.id}:`, error);
    
    if (error.message === 'Không tìm thấy hợp đồng') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết hợp đồng'
    });
  }
});

// @desc    Tạo hợp đồng mới
// @route   POST /api/contracts
// @access  Private
const createContract = asyncHandler(async (req, res) => {
  try {
    // Lấy thông tin user từ middleware auth
    const userId = req.user.id;
    
    // Lấy thông tin từ request body
    const { title, contract_type, partner, start_date, end_date, signature } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!title || !contract_type || !partner || !start_date) {
      // Nếu có file đã upload, xóa file đó
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: tiêu đề, loại hợp đồng, đối tác và ngày bắt đầu'
      });
    }
    
    // Kiểm tra file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file hợp đồng'
      });
    }
    
    // Tạo đường dẫn file để lưu vào DB
    const fileUrl = `/uploads/contracts/${req.file.filename}`;
    
    // Chuẩn bị dữ liệu để lưu vào DB
    const contractData = {
      userId,
      title,
      contract_type,
      partner,
      start_date,
      end_date: end_date || null,
      signature: signature || null,
      file_url: fileUrl
    };
    
    // Lưu hợp đồng vào DB
    const newContract = await contractModel.createContract(contractData);
    
    res.status(201).json({
      success: true,
      message: 'Tạo hợp đồng thành công',
      data: newContract
    });
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng mới:', error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo hợp đồng mới'
    });
  }
});

// @desc    Cập nhật hợp đồng
// @route   PUT /api/contracts/:id
// @access  Private
const updateContract = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const contractId = req.params.id;
    
    // Lấy thông tin hợp đồng hiện tại để xác định quyền truy cập và lấy đường dẫn file cũ
    let existingContract;
    
    try {
      existingContract = await contractModel.getContractById(contractId, userId);
    } catch (error) {
      // Nếu có file đã upload, xóa file đó
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng hoặc bạn không có quyền cập nhật'
      });
    }
    
    // Lấy thông tin từ request body
    const { title, contract_type, partner, start_date, end_date, signature } = req.body;
    
    // Chuẩn bị dữ liệu cập nhật
    const contractData = {};
    
    if (title) contractData.title = title;
    if (contract_type) contractData.contract_type = contract_type;
    if (partner) contractData.partner = partner;
    if (start_date) contractData.start_date = start_date;
    contractData.end_date = end_date || null;
    contractData.signature = signature || null;
    
    // Xử lý file nếu có
    if (req.file) {
      // Tạo đường dẫn file mới
      const fileUrl = `/uploads/contracts/${req.file.filename}`;
      contractData.file_url = fileUrl;
      
      // Xóa file cũ nếu tồn tại
      const oldFilePath = path.join(__dirname, '../../', existingContract.file_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Cập nhật hợp đồng trong DB
    const updatedContract = await contractModel.updateContract(contractId, userId, contractData);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật hợp đồng thành công',
      data: updatedContract
    });
  } catch (error) {
    console.error(`Lỗi khi cập nhật hợp đồng ID ${req.params.id}:`, error);
    
    // Nếu có file đã upload, xóa file đó khi gặp lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hợp đồng'
    });
  }
});

// @desc    Xóa hợp đồng
// @route   DELETE /api/contracts/:id
// @access  Private
const deleteContract = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const contractId = req.params.id;
    
    // Xóa hợp đồng trong DB
    const result = await contractModel.deleteContract(contractId, userId);
    
    // Nếu có đường dẫn file, thực hiện xóa file
    if (result.fileUrl) {
      const filePath = path.join(__dirname, '../../', result.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Xóa hợp đồng thành công',
      id: result.id
    });
  } catch (error) {
    console.error(`Lỗi khi xóa hợp đồng ID ${req.params.id}:`, error);
    
    if (error.message.includes('không có quyền')) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa hợp đồng này'
      });
    }
    
    if (error.message.includes('không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa hợp đồng'
    });
  }
});

// @desc    Tải xuống file hợp đồng
// @route   GET /api/contracts/:id/download
// @access  Private
const downloadContract = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const contractId = req.params.id;
    
    console.log(`Yêu cầu tải xuống hợp đồng ID ${contractId} từ người dùng ${userId}`);
    
    // Lấy thông tin hợp đồng
    const contract = await contractModel.getContractById(contractId, userId);
    
    // Kiểm tra đường dẫn file
    if (!contract.file_url) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file hợp đồng'
      });
    }
    
    // Tạo đường dẫn tuyệt đối đến file
    const filePath = path.join(__dirname, '../../', contract.file_url);
    console.log(`Đường dẫn file: ${filePath}`);
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File hợp đồng không tồn tại'
      });
    }
    
    // Lấy tên file từ đường dẫn
    const fileName = path.basename(contract.file_url);
    
    // Lấy extension của file
    const fileExt = path.extname(fileName).toLowerCase();
    console.log(`Phần mở rộng file: ${fileExt}`);
    
    // Xác định MIME type dựa trên extension
    let contentType = 'application/octet-stream';
    
    if (fileExt === '.pdf') {
      contentType = 'application/pdf';
    } else if (fileExt === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExt === '.doc') {
      contentType = 'application/msword';
    } else if (fileExt === '.txt') {
      contentType = 'text/plain';
    }
    
    // Tạo tên file thân thiện cho người dùng
    const originalFileName = `${contract.title}${fileExt}`;
    console.log(`Tên file: ${originalFileName}, Content-Type: ${contentType}`);
    
    // Thiết lập header
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
    
    // Sử dụng res.download thay vì pipe stream
    res.download(filePath, originalFileName, (err) => {
      if (err) {
        console.error(`Lỗi khi tải xuống file: ${err.message}`);
        // Nếu đã gửi header thì không thể gửi lỗi dạng JSON
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Lỗi khi tải xuống file'
          });
        }
      }
    });
  } catch (error) {
    console.error(`Lỗi khi tải xuống file hợp đồng ID ${req.params.id}:`, error);
    
    if (error.message === 'Không tìm thấy hợp đồng') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hợp đồng'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải xuống file hợp đồng'
    });
  }
});

module.exports = {
  getContracts,
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  downloadContract
}; 