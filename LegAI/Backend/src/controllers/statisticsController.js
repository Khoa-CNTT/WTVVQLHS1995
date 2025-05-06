const statisticsModel = require('../models/statisticsModel');
const { format } = require('date-fns');
const path = require('path');
const fs = require('fs');

// Lấy danh sách báo cáo
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, report_type, start_date, end_date } = req.query;
    
    // Lấy thông tin người dùng hiện tại từ request
    const userId = req.user ? req.user.id : null;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      report_type,
      start_date,
      end_date,
      created_by: req.user && req.user.role !== 'admin' ? userId : null
    };
    
    const result = await statisticsModel.getAllReports(options);
    
    res.status(200).json({
      status: 'success',
      data: result.reports,
      pagination: {
        totalItems: result.total,
        totalPages: result.pages,
        currentPage: result.page,
        itemsPerPage: result.limit
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Lấy báo cáo theo ID
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await statisticsModel.getReportById(id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Báo cáo không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && report.created_by !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền truy cập báo cáo này'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Error getting report by id:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Tạo báo cáo mới
const createReport = async (req, res) => {
  try {
    const { 
      report_name, 
      report_type, 
      start_date, 
      end_date, 
      is_published, 
      report_format
    } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!report_name || !report_type || !start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin báo cáo'
      });
    }
    
    // Kiểm tra loại báo cáo hợp lệ
    const validReportTypes = ['user', 'financial', 'activity', 'comprehensive'];
    if (!validReportTypes.includes(report_type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Loại báo cáo không hợp lệ'
      });
    }
    
    // Lấy dữ liệu báo cáo theo loại
    let reportData;
    
    switch (report_type) {
      case 'user':
        reportData = await statisticsModel.generateUserStatistics(start_date, end_date);
        break;
      case 'financial':
        reportData = await statisticsModel.generateFinancialStatistics(start_date, end_date);
        break;
      case 'activity':
        reportData = await statisticsModel.generateActivityStatistics(start_date, end_date);
        break;
      case 'comprehensive':
        reportData = await statisticsModel.generateComprehensiveReport(start_date, end_date);
        break;
    }
    
    // Tạo báo cáo mới
    const newReport = await statisticsModel.createReport({
      report_name,
      report_type,
      start_date,
      end_date,
      report_data: reportData,
      chart_data: req.body.chart_data || null,
      created_by: req.user.id,
      is_published: is_published || false,
      report_format: report_format || 'json'
    });
    
    res.status(201).json({
      status: 'success',
      data: newReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Cập nhật báo cáo
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      report_name, 
      report_type, 
      start_date, 
      end_date, 
      is_published, 
      report_format 
    } = req.body;
    
    // Kiểm tra báo cáo tồn tại
    const existingReport = await statisticsModel.getReportById(id);
    
    if (!existingReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Báo cáo không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && existingReport.created_by !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền cập nhật báo cáo này'
      });
    }
    
    // Nếu cập nhật loại báo cáo hoặc khoảng thời gian, cần tạo lại dữ liệu
    let reportData = existingReport.report_data;
    
    if ((report_type && report_type !== existingReport.report_type) ||
        (start_date && start_date !== existingReport.start_date) ||
        (end_date && end_date !== existingReport.end_date)) {
      
      const newStartDate = start_date || existingReport.start_date;
      const newEndDate = end_date || existingReport.end_date;
      const newReportType = report_type || existingReport.report_type;
      
      switch (newReportType) {
        case 'user':
          reportData = await statisticsModel.generateUserStatistics(newStartDate, newEndDate);
          break;
        case 'financial':
          reportData = await statisticsModel.generateFinancialStatistics(newStartDate, newEndDate);
          break;
        case 'activity':
          reportData = await statisticsModel.generateActivityStatistics(newStartDate, newEndDate);
          break;
        case 'comprehensive':
          reportData = await statisticsModel.generateComprehensiveReport(newStartDate, newEndDate);
          break;
      }
    }
    
    // Cập nhật báo cáo
    const updatedReport = await statisticsModel.updateReport(id, {
      report_name,
      report_type,
      start_date,
      end_date,
      report_data: reportData,
      chart_data: req.body.chart_data,
      is_published,
      report_format
    });
    
    res.status(200).json({
      status: 'success',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Xóa báo cáo
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra báo cáo tồn tại
    const existingReport = await statisticsModel.getReportById(id);
    
    if (!existingReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Báo cáo không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && existingReport.created_by !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xóa báo cáo này'
      });
    }
    
    // Xóa báo cáo
    const result = await statisticsModel.deleteReport(id);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Xóa báo cáo thành công'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Tạo báo cáo thống kê người dùng
const generateUserStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Kiểm tra tham số đầu vào
    if (!start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc'
      });
    }
    
    const statistics = await statisticsModel.generateUserStatistics(start_date, end_date);
    
    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    console.error('Error generating user statistics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Tạo báo cáo thống kê tài chính
const generateFinancialStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Kiểm tra tham số đầu vào
    if (!start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc'
      });
    }
    
    const statistics = await statisticsModel.generateFinancialStatistics(start_date, end_date);
    
    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    console.error('Error generating financial statistics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Tạo báo cáo thống kê hoạt động
const generateActivityStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Kiểm tra tham số đầu vào
    if (!start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ngày bắt đầu và kết thúc'
      });
    }
    
    const statistics = await statisticsModel.generateActivityStatistics(start_date, end_date);
    
    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    console.error('Error generating activity statistics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Tạo báo cáo tổng hợp
const generateComprehensiveReport = async (req, res) => {
  try {
    // Báo cáo tổng hợp không cần lọc theo khoảng thời gian
    // Chỉ lấy tham số để duy trì khả năng tương thích với client
    const { start_date, end_date } = req.query;
    
    // Gọi model để tạo báo cáo tổng hợp
    const statistics = await statisticsModel.generateComprehensiveReport();
    
    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Xuất báo cáo sang CSV
const exportReportToCSV = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Nếu có token trong query params, thì sử dụng token đó để xác thực thay vì req.user
    let userId = null;
    let userRole = null;
    
    // Ưu tiên sử dụng user từ middleware protect nếu có
    if (req.user) {
      userId = req.user.id;
      userRole = req.user.role;
    } 
    // Nếu không có req.user, kiểm tra token trong query params
    else if (req.query.token) {
      try {
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';
        const decoded = jwt.verify(req.query.token, jwtSecret);
        userId = decoded.id;
        userRole = decoded.role;
      } catch (jwtError) {
        console.error('Lỗi khi xác thực token từ query params:', jwtError.message);
        return res.status(401).json({
          status: 'error',
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }
    } else {
      // Không có thông tin xác thực
      return res.status(401).json({
        status: 'error',
        message: 'Không có thông tin xác thực, không được phép truy cập'
      });
    }
    
    // Lấy báo cáo
    const existingReport = await statisticsModel.getReportById(id);
    
    if (!existingReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Báo cáo không tồn tại'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && existingReport.created_by !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xuất báo cáo này'
      });
    }
    
    // Xuất báo cáo sang CSV
    const csvData = await statisticsModel.exportReportToCSV(id);
    
    // Thiết lập header
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${csvData.filename}`);
    
    // Gửi dữ liệu CSV
    res.send(csvData.content);
  } catch (error) {
    console.error('Error exporting report to CSV:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Xuất báo cáo sang CSV (phương thức xác thực qua token trong body request)
const exportReportToCSVWithToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Không có token, không được phép truy cập'
      });
    }
    
    // Xác thực token
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'legai_jwt_super_secret_key_12345_secure_random_string';
    
    try {
      // Xác thực token
      const decoded = jwt.verify(token, jwtSecret);
      
      // Lấy báo cáo
      const existingReport = await statisticsModel.getReportById(id);
      
      if (!existingReport) {
        return res.status(404).json({
          status: 'error',
          message: 'Báo cáo không tồn tại'
        });
      }
      
      // Kiểm tra quyền truy cập
      if (decoded.role !== 'admin' && existingReport.created_by !== decoded.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Bạn không có quyền xuất báo cáo này'
        });
      }
      
      // Xuất báo cáo sang CSV
      const csvData = await statisticsModel.exportReportToCSV(id);
      
      // Thiết lập header
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${csvData.filename}`);
      
      // Gửi dữ liệu CSV
      res.send(csvData.content);
    } catch (jwtError) {
      console.error('Lỗi khi xác thực token:', jwtError.message);
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    console.error('Error exporting report to CSV with token:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateUserStatistics,
  generateFinancialStatistics,
  generateActivityStatistics,
  generateComprehensiveReport,
  exportReportToCSV,
  exportReportToCSVWithToken
}; 