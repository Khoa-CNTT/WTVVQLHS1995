import axios from 'axios';
import { API_URL } from '../config/constants';
import axiosInstance from '../config/axios';

const API_ENDPOINT = `${API_URL}/statistics`;

// Hàm kiểm tra token
const checkToken = () => {
  const token = localStorage.getItem('token');
  console.log('StatisticsService - Token hiện tại:', token ? 'Có token' : 'Không có token');
  return token;
};

// Lấy danh sách tất cả báo cáo
export const getReports = async (params = {}) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API getReports');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    const { page = 1, limit = 10, report_type, start_date, end_date } = params;
    console.log('StatisticsService - Gọi API getReports với params:', params);
    
    const response = await axiosInstance.get(`/statistics`, {
      params: {
        page,
        limit,
        report_type,
        start_date,
        end_date
      }
    });
    
    console.log('StatisticsService - Kết quả API getReports:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error fetching reports:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi lấy danh sách báo cáo' };
  }
};

// Lấy báo cáo theo ID
export const getReportById = async (id) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API getReportById');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API getReportById với ID: ${id}`);
    const response = await axiosInstance.get(`/statistics/${id}`);
    console.log('StatisticsService - Kết quả API getReportById:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error fetching report by ID:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi lấy báo cáo' };
  }
};

// Tạo báo cáo mới
export const createReport = async (reportData) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API createReport');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log('StatisticsService - Gọi API createReport với data:', reportData);
    const response = await axiosInstance.post(`/statistics`, reportData);
    console.log('StatisticsService - Kết quả API createReport:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error creating report:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi tạo báo cáo' };
  }
};

// Cập nhật báo cáo
export const updateReport = async (id, reportData) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API updateReport');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API updateReport với ID: ${id}`, reportData);
    const response = await axiosInstance.put(`/statistics/${id}`, reportData);
    console.log('StatisticsService - Kết quả API updateReport:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error updating report:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi cập nhật báo cáo' };
  }
};

// Xóa báo cáo
export const deleteReport = async (id) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API deleteReport');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API deleteReport với ID: ${id}`);
    const response = await axiosInstance.delete(`/statistics/${id}`);
    console.log('StatisticsService - Kết quả API deleteReport:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error deleting report:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi xóa báo cáo' };
  }
};

// Tạo báo cáo thống kê người dùng
export const generateUserStatistics = async (start_date, end_date) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API generateUserStatistics');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API generateUserStatistics từ ${start_date} đến ${end_date}`);
    const response = await axiosInstance.get(`/statistics/generate/user-statistics`, {
      params: { start_date, end_date }
    });
    console.log('StatisticsService - Kết quả API generateUserStatistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error generating user statistics:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi tạo thống kê người dùng' };
  }
};

// Tạo báo cáo thống kê tài chính
export const generateFinancialStatistics = async (start_date, end_date) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API generateFinancialStatistics');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API generateFinancialStatistics từ ${start_date} đến ${end_date}`);
    const response = await axiosInstance.get(`/statistics/generate/financial-statistics`, {
      params: { start_date, end_date }
    });
    console.log('StatisticsService - Kết quả API generateFinancialStatistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error generating financial statistics:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi tạo thống kê tài chính' };
  }
};

// Tạo báo cáo thống kê hoạt động
export const generateActivityStatistics = async (start_date, end_date) => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API generateActivityStatistics');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Gọi API generateActivityStatistics từ ${start_date} đến ${end_date}`);
    const response = await axiosInstance.get(`/statistics/generate/activity-statistics`, {
      params: { start_date, end_date }
    });
    console.log('StatisticsService - Kết quả API generateActivityStatistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('StatisticsService - Error generating activity statistics:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi tạo thống kê hoạt động' };
  }
};

// Tạo báo cáo thống kê tổng hợp
export const generateComprehensiveReport = async () => {
  try {
    // Kiểm tra token trước khi gọi API
    const hasToken = checkToken();
    if (!hasToken) {
      console.error('StatisticsService - Không có token để gọi API generateComprehensiveReport');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log('StatisticsService - Gọi API generateComprehensiveReport (tất cả dữ liệu)');
    
    try {
      const response = await axiosInstance.get(`/statistics/generate/comprehensive-report`);
      
      console.log('StatisticsService - Kết quả API generateComprehensiveReport:', response.data);
      return response.data;
    } catch (apiError) {
      console.error('StatisticsService - Lỗi từ server khi gọi generateComprehensiveReport:', apiError);
      
      // Lấy thông tin lỗi chi tiết từ phản hồi của server
      if (apiError.response && apiError.response.data) {
        console.error('StatisticsService - Chi tiết lỗi từ server:', apiError.response.data);
        throw apiError.response.data;
      }
      
      throw { 
        status: 'error', 
        message: apiError.message || 'Lỗi khi tạo báo cáo tổng hợp từ server' 
      };
    }
  } catch (error) {
    console.error('StatisticsService - Error generating comprehensive report:', error);
    throw error.response?.data || error || { status: 'error', message: 'Lỗi khi tạo báo cáo tổng hợp' };
  }
};

// Xuất báo cáo ra CSV
export const exportReportToCSV = async (id) => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('StatisticsService - Không có token để gọi API exportReportToCSV');
      throw { status: 'error', message: 'Vui lòng đăng nhập để sử dụng chức năng này' };
    }

    console.log(`StatisticsService - Đang xuất báo cáo CSV với ID: ${id}`);
    
    // Tạo URL API trực tiếp với token trong query parameter để có thể mở trong thẻ mới
    const csvDownloadUrl = `${API_URL}/statistics/${id}/export-csv?token=${encodeURIComponent(token)}`;
    console.log('StatisticsService - URL tải xuống CSV:', csvDownloadUrl);
    
    // Mở URL trong tab mới
    window.open(csvDownloadUrl, '_blank');
    
    return { status: 'success', message: 'Đã mở tab tải xuống CSV' };
  } catch (error) {
    console.error('StatisticsService - Error exporting report to CSV:', error);
    throw error.response?.data || { status: 'error', message: 'Lỗi khi xuất báo cáo' };
  }
};

const statisticsService = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateUserStatistics,
  generateFinancialStatistics,
  generateActivityStatistics,
  generateComprehensiveReport,
  exportReportToCSV
};

export default statisticsService; 