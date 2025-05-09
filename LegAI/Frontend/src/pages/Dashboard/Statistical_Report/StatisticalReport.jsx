import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Button, DatePicker, Tabs, Select, Table, Typography, message, Modal, Form, Input, Empty, Skeleton, List, Space, Tag } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { DownloadOutlined, FileTextOutlined, UserOutlined, DollarOutlined, BarChartOutlined, PieChartOutlined, SaveOutlined, FileAddOutlined, DeleteOutlined, TeamOutlined, FileDoneOutlined, ScheduleOutlined, LineChartOutlined, RadarChartOutlined, AreaChartOutlined, FileProtectOutlined } from '@ant-design/icons';
import statisticsService from '../../../services/statisticsService';
import styles from './StatisticalReport.module.css';
import { formatCurrency } from '../../../utils/formatters';
import moment from 'moment';
import 'moment/locale/vi';

// Import các service cần thiết cho thống kê
import userService from '../../../services/userService';
import transactionService from '../../../services/transactionService';
import legalCaseService from '../../../services/legalCaseService';
import appointmentService from '../../../services/appointmentService';
import * as contractService from '../../../services/contractService';
import * as legalDocService from '../../../services/legalDocService';
import chatService from '../../../services/chatService';

moment.locale('vi');

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const StatisticalReport = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [activeTab, setActiveTab] = useState('user');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState({
    user: null,
    financial: null,
    activity: null,
    comprehensive: null
  });
  const [saveReportModalVisible, setSaveReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [currentReport, setCurrentReport] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Màu sắc cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

  // Tải các báo cáo đã lưu
  useEffect(() => {
    fetchReports();
  }, [page, limit]);

  // Hàm lấy danh sách báo cáo
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi fetchReports');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      console.log('StatisticalReport - Đang gọi getReports với params:', {
        page,
        limit,
        report_type: activeTab
      });
      
      const response = await statisticsService.getReports({
        page,
        limit,
        report_type: activeTab === 'user' ? 'user' : 
                     activeTab === 'financial' ? 'financial' : 
                     activeTab === 'activity' ? 'activity' : 'comprehensive'
      });
      
      console.log('StatisticalReport - Kết quả getReports:', response);
      
      if (response.status === 'success') {
        setReports(response.data);
        setTotal(response.pagination.totalItems);
      } else {
        message.error(response.message || 'Không thể tải danh sách báo cáo');
      }
    } catch (error) {
      console.error('Lỗi chi tiết fetchReports:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(error.message || 'Không thể tải danh sách báo cáo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tải báo cáo theo ID
  const fetchReportById = async (id) => {
    try {
      setLoading(true);
      
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi fetchReportById');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      console.log(`StatisticalReport - Đang gọi getReportById với ID: ${id}`);
      const response = await statisticsService.getReportById(id);
      
      console.log('StatisticalReport - Kết quả getReportById:', response);
      
      if (response.status === 'success') {
        const report = response.data;
        // Xác định loại báo cáo và cập nhật state
        setStatistics({
          ...statistics,
          [report.report_type]: {
            data: report.report_data,
            report_id: report.id
          }
        });
        
        // Chuyển đến tab tương ứng
        setActiveTab(report.report_type);
        setCurrentReport(report);
      } else {
        message.error(response.message || 'Không thể tải báo cáo');
      }
    } catch (error) {
      console.error('Lỗi chi tiết fetchReportById:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(error.message || 'Không thể tải báo cáo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Tạo báo cáo thống kê người dùng
  const generateUserStatistics = async (start_date, end_date) => {
    try {
      // Nếu không phải báo cáo tổng hợp, yêu cầu chọn khoảng thời gian
      if (!start_date || !end_date) {
        message.warning('Vui lòng chọn khoảng thời gian');
        return;
      }

      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi generateUserStatistics');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setLoading(true);
      
      console.log(`StatisticalReport - Đang tạo báo cáo người dùng từ ${start_date} đến ${end_date}`);
      
      // Lấy dữ liệu từ userService
      const usersResponse = await userService.getUsers({
        page: 1,
        limit: 1000,
        startDate: start_date,
        endDate: end_date
      });

      console.log('Dữ liệu từ userService.getUsers():', usersResponse);
      
      // Trích xuất dữ liệu người dùng từ phản hồi
      let users = [];
      
      // Xử lý các trường hợp cấu trúc dữ liệu khác nhau
      if (usersResponse) {
        // Trường hợp 1: { data: [...users] }
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          users = usersResponse.data;
        }
        // Trường hợp 2: { status: 'success', data: [...users] }
        else if (usersResponse.status === 'success' && Array.isArray(usersResponse.data)) {
          users = usersResponse.data;
        }
        // Trường hợp 3: { status: 'success', data: { users: [...] } }
        else if (usersResponse.status === 'success' && usersResponse.data && Array.isArray(usersResponse.data.users)) {
          users = usersResponse.data.users;
        }
        // Trường hợp 4: { users: [...users] }
        else if (usersResponse.users && Array.isArray(usersResponse.users)) {
          users = usersResponse.users;
        }
        // Trường hợp 5: { data: { users: [...users] } }
        else if (usersResponse.data && usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
          users = usersResponse.data.users;
        }
        // Trường hợp 6: Đối tượng trống hoặc không có dữ liệu
        else {
          console.error('Không thể xác định cấu trúc dữ liệu người dùng:', usersResponse);
          throw new Error('Cấu trúc dữ liệu người dùng không đúng định dạng');
        }
      } else {
        throw new Error('Không nhận được dữ liệu từ API');
      }
      
      // Kiểm tra có dữ liệu không
      if (!users || users.length === 0) {
        throw new Error('Không có dữ liệu người dùng trong khoảng thời gian này');
      }
      
      console.log(`Đã xử lý ${users.length} người dùng từ API`);
      
      // Tính toán thống kê
      const totalUsers = users.length;
      
      // Thống kê theo vai trò
      const userByRole = [];
      const roleCount = {};
      
      users.forEach(user => {
        let role = 'unknown';
        
        // Xử lý trường role có thể khác nhau trong cấu trúc dữ liệu
        if (user.role) {
          role = user.role.toLowerCase();
        } else if (user.user_role) {
          role = user.user_role.toLowerCase();
        }
        
        roleCount[role] = (roleCount[role] || 0) + 1;
      });
      
      Object.keys(roleCount).forEach(role => {
        userByRole.push({
          role,
          count: roleCount[role]
        });
      });
      
      // Thống kê theo tháng
      const userByMonth = [];
      const monthCount = {};
      
      users.forEach(user => {
        // Xử lý các trường thời gian có thể khác nhau
        const createdAt = user.created_at || user.createdAt || user.created || user.registration_date;
        
        if (createdAt) {
          const month = moment(createdAt).format('MM/YYYY');
          monthCount[month] = (monthCount[month] || 0) + 1;
        }
      });
      
      Object.keys(monthCount).sort().forEach(month => {
        userByMonth.push({
          month,
          count: monthCount[month]
        });
      });
      
      // Thống kê luật sư theo trạng thái
      const lawyerByStatus = [];
      const lawyerStatusCount = {};
      
      const lawyers = users.filter(user => {
        const role = user.role || user.user_role || '';
        return role.toLowerCase() === 'lawyer';
      });
      
      lawyers.forEach(lawyer => {
        const status = lawyer.status || lawyer.account_status || 'active';
        lawyerStatusCount[status] = (lawyerStatusCount[status] || 0) + 1;
      });
      
      Object.keys(lawyerStatusCount).forEach(status => {
        lawyerByStatus.push({
          status,
          count: lawyerStatusCount[status]
        });
      });
      
      // Tạo đối tượng phản hồi
      const response = {
        status: 'success',
        data: {
          totalUsers,
          userByRole,
          userByMonth,
          lawyerByStatus
        }
      };
      
      console.log('StatisticalReport - Kết quả tạo báo cáo người dùng:', response);
      
      // Cập nhật state
      setStatistics({
        ...statistics,
        user: {
          data: response.data,
          generated: true
        }
      });
      
      message.success('Đã tạo báo cáo người dùng thành công');
      
      // Hiện modal lưu báo cáo
      setSaveReportModalVisible(true);

      return response;
    } catch (error) {
      console.error('Lỗi chi tiết khi tạo báo cáo người dùng:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        // Hiển thị thông báo lỗi chi tiết
        const errorMessage = error.message || 'Không thể tạo báo cáo người dùng';
        message.error(errorMessage);
      }
      
      // Cập nhật state để hiển thị Empty khi không có dữ liệu
      setStatistics({
        ...statistics,
        user: {
          data: null,
          generated: true,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Tạo báo cáo mới
  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      setCurrentReport(null);
      
      // Lấy khoảng thời gian hiện tại nếu không có giá trị
      let start_date = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null;
      let end_date = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null;
      
      // Thiết lập mặc định là hôm nay nếu không có ngày được chọn
      if (!start_date || !end_date) {
        if (reportType === 'comprehensive') {
          // Báo cáo tổng hợp không cần ngày tháng
          console.log('StatisticalReport - Tạo báo cáo tổng hợp không cần khoảng thời gian');
        } else {
          // Cảnh báo nếu là báo cáo khác và không có ngày được chọn
          message.warning('Không có khoảng thời gian được chọn, sử dụng ngày hôm nay');
          start_date = moment().format('YYYY-MM-DD');
          end_date = moment().format('YYYY-MM-DD');
          setDateRange([moment(), moment()]);
        }
      }
      
      console.log(`StatisticalReport - Đang tạo báo cáo ${reportType} từ ${start_date || 'N/A'} đến ${end_date || 'N/A'}`);
      
      let response = null;
      
      // Tạo báo cáo dựa trên loại
      switch (reportType) {
        case 'user':
          await generateUserStatistics(start_date, end_date);
          break;
        case 'financial':
          await generateFinancialStatistics(start_date, end_date);
          break;
        case 'activity':
          await generateActivityStatistics(start_date, end_date);
          break;
        case 'comprehensive':
          await generateComprehensiveReport();
          break;
        default:
          message.error('Loại báo cáo không hợp lệ');
          break;
      }
      
      // Chuyển sang tab tương ứng
      setActiveTab(reportType);
    } catch (error) {
      console.error(`Lỗi chi tiết khi tạo báo cáo ${reportType}:`, error);
      
      // Thông báo lỗi chi tiết cho người dùng
      let errorMessage = error.message || `Không thể tạo báo cáo ${reportType}`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tạo báo cáo thống kê tài chính
  const generateFinancialStatistics = async (start_date, end_date) => {
    try {
      // Nếu không phải báo cáo tổng hợp, yêu cầu chọn khoảng thời gian
      if (!start_date || !end_date) {
        message.warning('Vui lòng chọn khoảng thời gian');
        return;
      }

      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi generateFinancialStatistics');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setLoading(true);
      
      console.log(`StatisticalReport - Đang tạo báo cáo tài chính từ ${start_date} đến ${end_date}`);
      
      try {
        // Lấy dữ liệu từ transactionService
        const transactionsResponse = await transactionService.getAllTransactions({
          startDate: start_date,
          endDate: end_date,
          limit: 1000
        });
  
        console.log('Dữ liệu từ transactionService.getAllTransactions():', transactionsResponse);
        
        // Trích xuất dữ liệu giao dịch từ phản hồi
        let transactions = [];
        
        // Xử lý các trường hợp cấu trúc dữ liệu khác nhau
        if (transactionsResponse) {
          // Trường hợp 1: { data: { transactions: [...] } }
          if (transactionsResponse.data && transactionsResponse.data.transactions && Array.isArray(transactionsResponse.data.transactions)) {
            transactions = transactionsResponse.data.transactions;
          }
          // Trường hợp 2: { data: [...] }
          else if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
            transactions = transactionsResponse.data;
          }
          // Trường hợp 3: { transactions: [...] }
          else if (transactionsResponse.transactions && Array.isArray(transactionsResponse.transactions)) {
            transactions = transactionsResponse.transactions;
          }
          // Trường hợp 4: { status: 'success', data: [...] }
          else if (transactionsResponse.status === 'success' && Array.isArray(transactionsResponse.data)) {
            transactions = transactionsResponse.data;
          }
          // Trường hợp 5: { status: 'success', data: { data: [...] } }
          else if (transactionsResponse.status === 'success' && transactionsResponse.data && Array.isArray(transactionsResponse.data.data)) {
            transactions = transactionsResponse.data.data;
          }
        }
        
        // Kiểm tra có dữ liệu không
        if (!transactions || transactions.length === 0) {
          // Dùng dữ liệu mẫu nếu không có dữ liệu thực
          console.log('Không có dữ liệu giao dịch thực, sử dụng dữ liệu mẫu');
          
          // Dữ liệu mẫu
          const sampleData = {
            transactionByMonth: [
              { month: '01/2025', total_amount: 5000000, count: 3 },
              { month: '02/2025', total_amount: 7500000, count: 5 },
              { month: '03/2025', total_amount: 12000000, count: 8 },
              { month: '04/2025', total_amount: 8500000, count: 6 },
              { month: '05/2025', total_amount: 15000000, count: 10 }
            ],
            transactionByStatus: [
              { status: 'completed', total_amount: 35000000, count: 25 },
              { status: 'pending', total_amount: 12000000, count: 8 },
              { status: 'failed', total_amount: 1000000, count: 2 }
            ],
            transactionByMethod: [
              { payment_method: 'bank_transfer', total_amount: 30000000, count: 20 },
              { payment_method: 'credit_card', total_amount: 15000000, count: 10 },
              { payment_method: 'e-wallet', total_amount: 3000000, count: 5 }
            ],
            topLawyers: [
              { lawyer_id: 1, lawyer_name: 'Nguyễn Văn A', transaction_count: 12, total_amount: 18000000 },
              { lawyer_id: 2, lawyer_name: 'Trần Thị B', transaction_count: 8, total_amount: 12000000 },
              { lawyer_id: 3, lawyer_name: 'Lê Văn C', transaction_count: 6, total_amount: 9000000 },
              { lawyer_id: 4, lawyer_name: 'Phạm Thị D', transaction_count: 5, total_amount: 7500000 },
              { lawyer_id: 5, lawyer_name: 'Hoàng Văn E', transaction_count: 4, total_amount: 6000000 }
            ]
          };
          
          const response = {
            status: 'success',
            data: sampleData
          };
          
          console.log('StatisticalReport - Kết quả tạo báo cáo tài chính (mẫu):', response);
          
          // Cập nhật state
          setStatistics({
            ...statistics,
            financial: {
              data: response.data,
              generated: true,
              isSampleData: true
            }
          });
          
          message.info('Đã tạo báo cáo tài chính với dữ liệu mẫu (không có dữ liệu thực)');
          
          // Hiện modal lưu báo cáo
          setSaveReportModalVisible(true);
          
          return response;
        }
        
        console.log(`Đã xử lý ${transactions.length} giao dịch từ API`);
        
        // Thống kê theo tháng
        const transactionByMonth = [];
        const monthData = {};
        
        transactions.forEach(transaction => {
          // Xử lý các trường thời gian có thể khác nhau
          const createdAt = transaction.created_at || transaction.createdAt || transaction.created || transaction.transaction_date;
          
          if (createdAt) {
            const month = moment(createdAt).format('MM/YYYY');
            
            if (!monthData[month]) {
              monthData[month] = {
                month,
                total_amount: 0,
                count: 0
              };
            }
            
            // Xử lý trường amount có thể khác nhau
            const amount = parseFloat(transaction.amount || transaction.total_amount || transaction.value || 0);
            
            monthData[month].total_amount += amount;
            monthData[month].count += 1;
          }
        });
        
        Object.values(monthData).sort((a, b) => {
          const [monthA, yearA] = a.month.split('/');
          const [monthB, yearB] = b.month.split('/');
          return new Date(`${yearA}-${monthA}`) - new Date(`${yearB}-${monthB}`);
        }).forEach(data => {
          transactionByMonth.push(data);
        });
        
        // Thống kê theo trạng thái
        const transactionByStatus = [];
        const statusData = {};
        
        transactions.forEach(transaction => {
          // Xử lý trường status có thể khác nhau
          const status = transaction.status || transaction.transaction_status || 'pending';
          
          if (!statusData[status]) {
            statusData[status] = {
              status,
              total_amount: 0,
              count: 0
            };
          }
          
          // Xử lý trường amount có thể khác nhau
          const amount = parseFloat(transaction.amount || transaction.total_amount || transaction.value || 0);
          
          statusData[status].total_amount += amount;
          statusData[status].count += 1;
        });
        
        Object.values(statusData).forEach(data => {
          transactionByStatus.push(data);
        });
        
        // Thống kê theo phương thức thanh toán
        const transactionByMethod = [];
        const methodData = {};
        
        transactions.forEach(transaction => {
          // Xử lý trường payment_method có thể khác nhau
          const payment_method = transaction.payment_method || transaction.paymentMethod || transaction.method || 'unknown';
          
          if (!methodData[payment_method]) {
            methodData[payment_method] = {
              payment_method,
              total_amount: 0,
              count: 0
            };
          }
          
          // Xử lý trường amount có thể khác nhau
          const amount = parseFloat(transaction.amount || transaction.total_amount || transaction.value || 0);
          
          methodData[payment_method].total_amount += amount;
          methodData[payment_method].count += 1;
        });
        
        Object.values(methodData).forEach(data => {
          transactionByMethod.push(data);
        });
        
        // Thống kê top luật sư
        const lawyerData = {};
        
        transactions.forEach(transaction => {
          // Xử lý trường lawyer_id có thể khác nhau
          const lawyer_id = transaction.lawyer_id || transaction.lawyerId || transaction.lawyer?.id;
          
          if (lawyer_id) {
            // Xử lý trường lawyer_name có thể khác nhau
            const lawyer_name = transaction.lawyer_name || 
                                transaction.lawyerName || 
                                (transaction.lawyer ? (transaction.lawyer.fullName || transaction.lawyer.full_name || transaction.lawyer.name) : null) || 
                                `Luật sư ID: ${lawyer_id}`;
            
            if (!lawyerData[lawyer_id]) {
              lawyerData[lawyer_id] = {
                lawyer_id,
                lawyer_name,
                total_amount: 0,
                transaction_count: 0
              };
            }
            
            // Xử lý trường amount có thể khác nhau
            const amount = parseFloat(transaction.amount || transaction.total_amount || transaction.value || 0);
            
            lawyerData[lawyer_id].total_amount += amount;
            lawyerData[lawyer_id].transaction_count += 1;
          }
        });
        
        const topLawyers = Object.values(lawyerData)
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 10);
        
        // Tạo đối tượng phản hồi
        const response = {
          status: 'success',
          data: {
            transactionByMonth,
            transactionByStatus,
            transactionByMethod,
            topLawyers
          }
        };
        
        console.log('StatisticalReport - Kết quả tạo báo cáo tài chính:', response);
        
        // Cập nhật state
        setStatistics({
          ...statistics,
          financial: {
            data: response.data,
            generated: true
          }
        });
        
        message.success('Đã tạo báo cáo tài chính thành công');
        
        // Hiện modal lưu báo cáo
        setSaveReportModalVisible(true);
  
        return response;
      } catch (apiError) {
        console.error('Lỗi khi gọi API:', apiError);
        
        // Tạo dữ liệu mẫu trong trường hợp có lỗi
        const sampleData = {
          transactionByMonth: [
            { month: '01/2025', total_amount: 5000000, count: 3 },
            { month: '02/2025', total_amount: 7500000, count: 5 },
            { month: '03/2025', total_amount: 12000000, count: 8 },
            { month: '04/2025', total_amount: 8500000, count: 6 },
            { month: '05/2025', total_amount: 15000000, count: 10 }
          ],
          transactionByStatus: [
            { status: 'completed', total_amount: 35000000, count: 25 },
            { status: 'pending', total_amount: 12000000, count: 8 },
            { status: 'failed', total_amount: 1000000, count: 2 }
          ],
          transactionByMethod: [
            { payment_method: 'bank_transfer', total_amount: 30000000, count: 20 },
            { payment_method: 'credit_card', total_amount: 15000000, count: 10 },
            { payment_method: 'e-wallet', total_amount: 3000000, count: 5 }
          ],
          topLawyers: [
            { lawyer_id: 1, lawyer_name: 'Nguyễn Văn A', transaction_count: 12, total_amount: 18000000 },
            { lawyer_id: 2, lawyer_name: 'Trần Thị B', transaction_count: 8, total_amount: 12000000 },
            { lawyer_id: 3, lawyer_name: 'Lê Văn C', transaction_count: 6, total_amount: 9000000 },
            { lawyer_id: 4, lawyer_name: 'Phạm Thị D', transaction_count: 5, total_amount: 7500000 },
            { lawyer_id: 5, lawyer_name: 'Hoàng Văn E', transaction_count: 4, total_amount: 6000000 }
          ]
        };
        
        const response = {
          status: 'success',
          data: sampleData
        };
        
        console.log('StatisticalReport - Sử dụng dữ liệu mẫu vì lỗi API:', response);
        
        // Cập nhật state
        setStatistics({
          ...statistics,
          financial: {
            data: response.data,
            generated: true,
            isSampleData: true
          }
        });
        
        message.info('Đang sử dụng dữ liệu mẫu do không thể kết nối đến API');
        
        // Hiện modal lưu báo cáo
        setSaveReportModalVisible(true);
        
        return response;
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi tạo báo cáo tài chính:', error);
      
      message.error(error.message || 'Không thể tạo báo cáo tài chính');
      
      // Cập nhật state để hiển thị Empty khi không có dữ liệu
      setStatistics({
        ...statistics,
        financial: {
          data: null,
          generated: true,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Tạo báo cáo thống kê hoạt động
  const generateActivityStatistics = async (start_date, end_date) => {
    try {
      setLoading(true);
      
      console.log('StatisticalReport - Đang tạo báo cáo hoạt động từ', start_date, 'đến', end_date);
      
      // Lấy danh sách vụ án trong khoảng thời gian
      const casesResponse = await legalCaseService.getAllLegalCases({
        limit: 1000,
        startDate: start_date,
        endDate: end_date
      });

      // Lấy dữ liệu cuộc hẹn từ appointmentService
      const appointmentsResponse = await appointmentService.getAllAppointments({
        limit: 1000,
        startDate: start_date,
        endDate: end_date
      });

      console.log('Dữ liệu từ legalCaseService.getAllLegalCases():', casesResponse);
      console.log('Dữ liệu từ appointmentService.getAllAppointments():', appointmentsResponse);
      
      // Trích xuất dữ liệu vụ án từ phản hồi
      let cases = [];
      
      // Xử lý các trường hợp cấu trúc dữ liệu vụ án khác nhau
      if (casesResponse) {
        // Trường hợp 1: { data: { cases: [...] } }
        if (casesResponse.data && casesResponse.data.cases && Array.isArray(casesResponse.data.cases)) {
          cases = casesResponse.data.cases;
        }
        // Trường hợp 2: { data: [...] }
        else if (casesResponse.data && Array.isArray(casesResponse.data)) {
          cases = casesResponse.data;
        }
        // Trường hợp 3: { cases: [...] }
        else if (casesResponse.cases && Array.isArray(casesResponse.cases)) {
          cases = casesResponse.cases;
        }
        // Trường hợp 4: { status: 'success', data: [...] }
        else if (casesResponse.status === 'success' && Array.isArray(casesResponse.data)) {
          cases = casesResponse.data;
        }
        // Trường hợp 5: { status: 'success', data: { data: [...] } }
        else if (casesResponse.status === 'success' && casesResponse.data && Array.isArray(casesResponse.data.data)) {
          cases = casesResponse.data.data;
        }
        // Trường hợp 6: Đối tượng trống hoặc không có dữ liệu
        else {
          console.error('Không thể xác định cấu trúc dữ liệu vụ án:', casesResponse);
          cases = []; // Không throw lỗi, vẫn tiếp tục xử lý cuộc hẹn
          }
        } else {
        console.warn('Không nhận được dữ liệu vụ án từ API');
        cases = [];
      }
      
      // Trích xuất dữ liệu cuộc hẹn từ phản hồi
      let appointments = [];
      
      // Xử lý các trường hợp cấu trúc dữ liệu cuộc hẹn khác nhau
      if (appointmentsResponse) {
        // Trường hợp 1: { data: { appointments: [...] } }
        if (appointmentsResponse.data && appointmentsResponse.data.appointments && Array.isArray(appointmentsResponse.data.appointments)) {
          appointments = appointmentsResponse.data.appointments;
        }
        // Trường hợp 2: { data: [...] }
        else if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data)) {
          appointments = appointmentsResponse.data;
        }
        // Trường hợp 3: { appointments: [...] }
        else if (appointmentsResponse.appointments && Array.isArray(appointmentsResponse.appointments)) {
          appointments = appointmentsResponse.appointments;
        }
        // Trường hợp 4: { status: 'success', data: [...] }
        else if (appointmentsResponse.status === 'success' && Array.isArray(appointmentsResponse.data)) {
          appointments = appointmentsResponse.data;
        }
        // Trường hợp 5: { status: 'success', data: { data: [...] } }
        else if (appointmentsResponse.status === 'success' && appointmentsResponse.data && Array.isArray(appointmentsResponse.data.data)) {
          appointments = appointmentsResponse.data.data;
        }
        // Trường hợp 6: Đối tượng trống hoặc không có dữ liệu
        else {
          console.error('Không thể xác định cấu trúc dữ liệu cuộc hẹn:', appointmentsResponse);
          appointments = []; // Không throw lỗi
        }
      } else {
        console.warn('Không nhận được dữ liệu cuộc hẹn từ API');
        appointments = [];
      }
      
      console.log(`Đã xử lý ${cases.length} vụ án và ${appointments.length} cuộc hẹn từ API`);
      
      // Kiểm tra có dữ liệu không
      if ((!cases || cases.length === 0) && (!appointments || appointments.length === 0)) {
        throw new Error('Không có dữ liệu vụ án và cuộc hẹn trong khoảng thời gian này');
      }
      
      // Thống kê vụ án theo loại
      const caseByType = [];
      const typeCount = {};
      
      cases.forEach(caseItem => {
        // Xử lý trường case_type có thể khác nhau
        const case_type = caseItem.case_type || caseItem.caseType || caseItem.type || 'Khác';
        
        typeCount[case_type] = (typeCount[case_type] || 0) + 1;
      });
      
      Object.keys(typeCount).forEach(type => {
        caseByType.push({
          case_type: type,
          count: typeCount[type]
        });
      });
      
      // Thống kê vụ án theo trạng thái
      const caseByStatus = [];
      const statusCount = {};
      
      cases.forEach(caseItem => {
        // Xử lý trường status có thể khác nhau
        const status = caseItem.status || caseItem.caseStatus || 'new';
        
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      Object.keys(statusCount).forEach(status => {
        caseByStatus.push({
          status,
          count: statusCount[status]
        });
      });
      
      // Thống kê vụ án theo tháng
      const caseByMonth = [];
      const monthCount = {};
      
      cases.forEach(caseItem => {
        // Xử lý các trường thời gian có thể khác nhau
        const createdAt = caseItem.created_at || caseItem.createdAt || caseItem.created || caseItem.created_date;
        
        if (createdAt) {
          const month = moment(createdAt).format('MM/YYYY');
          monthCount[month] = (monthCount[month] || 0) + 1;
        }
      });
      
      Object.keys(monthCount).sort().forEach(month => {
        caseByMonth.push({
          month,
          count: monthCount[month]
        });
      });
      
      // Thống kê cuộc hẹn theo trạng thái
      const appointmentByStatus = [];
      const appointmentStatusCount = {};
      
      appointments.forEach(appointment => {
        // Xử lý trường status có thể khác nhau
        const status = appointment.status || appointment.appointmentStatus || 'pending';
        
        appointmentStatusCount[status] = (appointmentStatusCount[status] || 0) + 1;
      });
      
      Object.keys(appointmentStatusCount).forEach(status => {
        appointmentByStatus.push({
          status,
          count: appointmentStatusCount[status]
        });
      });
      
      // Thống kê cuộc hẹn theo tháng
      const appointmentByMonth = [];
      const appointmentMonthCount = {};
      
      appointments.forEach(appointment => {
        // Xử lý các trường thời gian có thể khác nhau
        const appointmentDate = appointment.appointment_date || 
                               appointment.appointmentDate || 
                               appointment.date ||
                               appointment.scheduledDate;
        
        if (appointmentDate) {
          const month = moment(appointmentDate).format('MM/YYYY');
          appointmentMonthCount[month] = (appointmentMonthCount[month] || 0) + 1;
        }
      });
      
      Object.keys(appointmentMonthCount).sort().forEach(month => {
        appointmentByMonth.push({
          month,
          count: appointmentMonthCount[month]
        });
      });
      
      // Thống kê top luật sư có nhiều vụ án nhất
      const lawyerCaseCount = {};
      
      cases.forEach(caseItem => {
        // Xử lý trường lawyer_id có thể khác nhau
        const lawyer_id = caseItem.lawyer_id || caseItem.lawyerId || (caseItem.lawyer ? caseItem.lawyer.id : null);
        
        if (lawyer_id) {
          // Xử lý trường lawyer_name có thể khác nhau
          const lawyer_name = caseItem.lawyer_name || 
                             caseItem.lawyerName || 
                             (caseItem.lawyer ? (caseItem.lawyer.fullName || caseItem.lawyer.full_name || caseItem.lawyer.name) : null) || 
                             `Luật sư ID: ${lawyer_id}`;
          
          if (!lawyerCaseCount[lawyer_id]) {
            lawyerCaseCount[lawyer_id] = {
              lawyer_id,
              lawyer_name,
              case_count: 0
            };
          }
          
          lawyerCaseCount[lawyer_id].case_count += 1;
        }
      });
      
      const topLawyers = Object.values(lawyerCaseCount)
        .sort((a, b) => b.case_count - a.case_count)
        .slice(0, 10);
      
      // Tạo đối tượng phản hồi
      const response = {
        status: 'success',
        data: {
          caseByType,
          caseByStatus,
          caseByMonth,
          appointmentByStatus,
          appointmentByMonth,
          topLawyers
        }
      };
      
      console.log('StatisticalReport - Kết quả tạo báo cáo hoạt động:', response);
      
      // Cập nhật state
      setStatistics({
        ...statistics,
        activity: {
          data: response.data,
          generated: true
        }
      });
      
      message.success('Đã tạo báo cáo hoạt động thành công');
      
      // Hiện modal lưu báo cáo
      setSaveReportModalVisible(true);

      return response;
    } catch (error) {
      console.error('Lỗi chi tiết khi tạo báo cáo hoạt động:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        // Hiển thị thông báo lỗi chi tiết
        const errorMessage = error.message || 'Không thể tạo báo cáo hoạt động';
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Lưu báo cáo mới
  const handleSaveReport = async (values) => {
    try {
      setLoading(true);
      
      // Kiểm tra đã có dữ liệu thống kê chưa
      const currentTabData = statistics[activeTab];
      
      if (!currentTabData || !currentTabData.data) {
        message.warning('Vui lòng tạo báo cáo thống kê trước khi lưu');
        setSaveReportModalVisible(false);
        return;
      }
      
      console.log('StatisticalReport - Đang lưu báo cáo', {
        ...values,
        report_type: activeTab,
        start_date: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null,
        end_date: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null,
      });
      
      // Gọi API tạo báo cáo mới
      const response = await statisticsService.createReport({
        report_name: values.report_name,
        report_type: activeTab,
        start_date: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null,
        end_date: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null,
        report_data: currentTabData.data,
        is_published: values.is_published || false
      });
      
      if (response.status === 'success') {
        message.success('Lưu báo cáo thành công');
        
        // Cập nhật danh sách báo cáo
        fetchReports();
        
        // Đặt report_id cho báo cáo hiện tại
        setStatistics({
          ...statistics,
          [activeTab]: {
            ...currentTabData,
            report_id: response.data.id
          }
        });
        
        // Đóng modal
        setSaveReportModalVisible(false);
        reportForm.resetFields();
      } else {
        message.error(response.message || 'Lưu báo cáo thất bại');
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi lưu báo cáo:', error);
      
      message.error(error.message || 'Không thể lưu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Xóa báo cáo
  const handleDeleteReport = async (id) => {
    try {
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi handleDeleteReport');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa báo cáo này?',
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          console.log(`StatisticalReport - Đang xóa báo cáo với ID: ${id}`);
          const response = await statisticsService.deleteReport(id);
          console.log('StatisticalReport - Kết quả xóa báo cáo:', response);
          
          if (response.status === 'success') {
            message.success('Đã xóa báo cáo thành công');
            fetchReports();
            
            // Nếu đang hiển thị báo cáo vừa xóa, reset state
            if (selectedReport === id) {
              setSelectedReport(null);
              if (currentReport && currentReport.id === id) {
                setStatistics({
                  ...statistics,
                  [currentReport.report_type]: null
                });
                setCurrentReport(null);
              }
            }
          } else {
            message.error(response.message || 'Không thể xóa báo cáo');
          }
        },
        onCancel() {
          console.log('StatisticalReport - Hủy xóa báo cáo');
        }
      });
    } catch (error) {
      console.error('Lỗi chi tiết khi xóa báo cáo:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(error.message || 'Không thể xóa báo cáo');
      }
    }
  };

  // Xuất báo cáo sang CSV
  const exportCsv = async (reportId) => {
    try {
      setLoading(true);
      
      // Kiểm tra xem reportId có tồn tại không
      if (!reportId) {
        message.error('Không thể xuất báo cáo không tồn tại');
        return;
      }
      
      console.log(`StatisticalReport - Đang xuất báo cáo có ID: ${reportId}`);
      
      // Lấy token
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        return;
      }
      
      // Gọi service để xuất báo cáo
      const response = await statisticsService.exportReportToCSV(reportId);
      
      if (response.status === 'success') {
        message.success('Đã mở tab tải xuống báo cáo CSV');
      } else {
        message.error('Không thể xuất báo cáo, vui lòng thử lại sau');
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi xuất CSV:', error);
      
      // Kiểm tra loại lỗi
      let errorMessage = 'Lỗi khi xuất báo cáo';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ánh xạ tên vai trò sang tiếng Việt cho biểu đồ người dùng
  const mapRoleToVietnamese = (role) => {
    const roleMap = {
      'admin': 'Quản trị viên',
      'client': 'Khách hàng',
      'lawyer': 'Luật sư',
      'staff': 'Nhân viên'
    };
    return roleMap[role] || role;
  };
  
  // Ánh xạ tên trạng thái sang tiếng Việt cho biểu đồ giao dịch và cuộc hẹn
  const mapStatusToVietnamese = (status) => {
    const statusMap = {
      'completed': 'Hoàn thành',
      'pending': 'Đang xử lý',
      'failed': 'Thất bại',
      'cancelled': 'Đã hủy',
      'confirmed': 'Đã xác nhận',
      'new': 'Mới',
      'in_progress': 'Đang xử lý',
      'requested': 'Yêu cầu',
      'rescheduled': 'Đổi lịch'
    };
    return statusMap[status] || status;
  };

  // Hiển thị báo cáo người dùng
  const renderUserStatistics = () => {
    const data = statistics.user;
    
    if (!data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Chưa có báo cáo thống kê người dùng</p>
          <Button type="primary" onClick={() => generateReport('user')} loading={loading}>
            Tạo báo cáo
          </Button>
        </div>
      );
    }
    
    // Kiểm tra dữ liệu có tồn tại và có cấu trúc đúng không
    if (!data.data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Không có dữ liệu thống kê người dùng</p>
          <Button type="primary" onClick={() => generateReport('user')} loading={loading}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }
    
    // Sử dụng dữ liệu thực từ API
    const userByRole = (data.data.userByRole && data.data.userByRole.length > 0) 
      ? data.data.userByRole 
      : [];
      
    const userByMonth = (data.data.userByMonth && data.data.userByMonth.length > 0) 
      ? data.data.userByMonth 
      : [];
      
    const lawyerByStatus = (data.data.lawyerByStatus && data.data.lawyerByStatus.length > 0) 
      ? data.data.lawyerByStatus 
      : [];
      
    const totalUsers = data.data.totalUsers || 0;
    
    // Kiểm tra nếu không có dữ liệu nào
    if (userByRole.length === 0 && userByMonth.length === 0 && lawyerByStatus.length === 0 && totalUsers === 0) {
      return (
        <div className={styles.emptyReport}>
          <Empty description="Không có dữ liệu thống kê người dùng trong khoảng thời gian này" />
          <Button type="primary" onClick={() => generateReport('user')} style={{ marginTop: 16 }}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card className={styles.summaryCard}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <UserOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{totalUsers}</div>
                      <div className={styles.statLabel}>Tổng người dùng</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <TeamOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {userByRole.find(item => item.role === 'lawyer')?.count || 0}
                      </div>
                      <div className={styles.statLabel}>Luật sư</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <UserOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {userByRole.find(item => item.role === 'client')?.count || 0}
                      </div>
                      <div className={styles.statLabel}>Khách hàng</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <TeamOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {(userByRole.find(item => item.role === 'admin')?.count || 0) + 
                         (userByRole.find(item => item.role === 'staff')?.count || 0)}
                      </div>
                      <div className={styles.statLabel}>Quản trị viên & Nhân viên</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        
          {userByRole.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê người dùng theo vai trò" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                      data={userByRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                  >
                      {userByRole.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {userByMonth.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Người dùng theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                    <Area
                    type="monotone"
                    dataKey="count"
                    name="Số lượng"
                    stroke="#8884d8"
                      fill="url(#colorCount)"
                    activeDot={{ r: 8 }}
                  />
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {lawyerByStatus.length > 0 && (
          <Col xs={24}>
            <Card title="Thống kê luật sư theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lawyerByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                    <Bar dataKey="count" name="Số lượng" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                      {lawyerByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {userByRole.length > 0 && (
          <Col xs={24}>
            <Card title="Bảng thống kê chi tiết" className={styles.tableCard}>
              <Table
                  dataSource={userByRole}
                rowKey="role"
                pagination={false}
                size="small"
              >
                <Table.Column title="Vai trò" dataIndex="role" key="role" />
                <Table.Column title="Số lượng" dataIndex="count" key="count" />
                <Table.Column
                  title="Tỷ lệ"
                  key="percent"
                  render={(text, record) => {
                      const percent = ((record.count / totalUsers) * 100).toFixed(2);
                    return `${percent}%`;
                  }}
                />
              </Table>
            </Card>
          </Col>
          )}
          
          <Col xs={24} className={styles.actionBar}>
            {data.report_id && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => exportCsv(data.report_id)}
              >
                Xuất báo cáo (CSV)
              </Button>
            )}
            {!data.report_id && data.generated && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setSaveReportModalVisible(true)}
              >
                Lưu báo cáo
              </Button>
            )}
          </Col>
        </Row>
      </div>
    );
  };

  // Hiển thị báo cáo tài chính
  const renderFinancialStatistics = () => {
    const data = statistics.financial;
    
    if (!data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Chưa có báo cáo thống kê tài chính</p>
          <Button type="primary" onClick={() => generateReport('financial')} loading={loading}>
            Tạo báo cáo
          </Button>
        </div>
      );
    }

    // Kiểm tra dữ liệu có tồn tại và có cấu trúc đúng không
    if (!data.data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Không có dữ liệu thống kê tài chính</p>
          <Button type="primary" onClick={() => generateReport('financial')} loading={loading}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }

    // Sử dụng dữ liệu thực từ API
    const transactionByMonth = (data.data.transactionByMonth && data.data.transactionByMonth.length > 0) 
      ? data.data.transactionByMonth 
      : [];
      
    const transactionByStatus = (data.data.transactionByStatus && data.data.transactionByStatus.length > 0) 
      ? data.data.transactionByStatus 
      : [];
      
    const transactionByMethod = (data.data.transactionByMethod && data.data.transactionByMethod.length > 0) 
      ? data.data.transactionByMethod 
      : [];
    
    const topLawyers = (data.data.topLawyers && data.data.topLawyers.length > 0) 
      ? data.data.topLawyers 
      : [];
    
    // Kiểm tra nếu không có dữ liệu nào
    if (transactionByMonth.length === 0 && transactionByStatus.length === 0 && 
        transactionByMethod.length === 0 && topLawyers.length === 0) {
      return (
        <div className={styles.emptyReport}>
          <Empty description="Không có dữ liệu thống kê tài chính trong khoảng thời gian này" />
          <Button type="primary" onClick={() => generateReport('financial')} style={{ marginTop: 16 }}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }

    // Tính tổng thu nhập
    const totalIncome = transactionByStatus
      .filter(item => item.status === 'completed')
      .reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
    
    // Tính tổng giao dịch
    const totalTransactions = transactionByStatus
      .reduce((sum, item) => sum + (parseFloat(item.count) || 0), 0);

    // Tính trung bình giao dịch
    const avgTransaction = totalTransactions > 0 
      ? totalIncome / totalTransactions
      : 0;

    // Tính số giao dịch thành công
    const successfulTransactions = transactionByStatus
      .find(item => item.status === 'completed')?.count || 0;

  return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card className={styles.summaryCard}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <DollarOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{formatCurrency(totalIncome)}</div>
                      <div className={styles.statLabel}>Tổng thu nhập</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileDoneOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{totalTransactions}</div>
                      <div className={styles.statLabel}>Tổng giao dịch</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <DollarOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{formatCurrency(avgTransaction)}</div>
                      <div className={styles.statLabel}>Trung bình/giao dịch</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileDoneOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {successfulTransactions}
                      </div>
                      <div className={styles.statLabel}>Giao dịch thành công</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          
          {transactionByMonth.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê giao dịch theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={transactionByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                    <Area
                    type="monotone"
                    dataKey="total_amount"
                    name="Tổng tiền"
                    stroke="#8884d8"
                      fill="url(#colorAmount)"
                    activeDot={{ r: 8 }}
                  />
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {transactionByStatus.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê giao dịch theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                      data={transactionByStatus}
                    dataKey="total_amount"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                  >
                      {transactionByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {transactionByMethod.length > 0 && (
          <Col xs={24}>
            <Card title="Thống kê giao dịch theo phương thức thanh toán" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactionByMethod}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="payment_method" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                    <Bar dataKey="total_amount" name="Tổng tiền" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                      {transactionByMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 6) % COLORS.length]} />
                      ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {topLawyers.length > 0 && (
          <Col xs={24}>
            <Card title="Top 10 luật sư có doanh thu cao nhất" className={styles.tableCard}>
              <Table
                  dataSource={topLawyers}
                rowKey="lawyer_id"
                pagination={false}
                size="small"
              >
                <Table.Column title="Luật sư" dataIndex="lawyer_name" key="lawyer_name" />
                <Table.Column
                  title="Số giao dịch"
                  dataIndex="transaction_count"
                  key="transaction_count"
                />
                <Table.Column
                  title="Tổng doanh thu"
                  dataIndex="total_amount"
                  key="total_amount"
                  render={(text) => formatCurrency(text)}
                />
              </Table>
            </Card>
          </Col>
          )}
          
          <Col xs={24} className={styles.actionBar}>
            {data.report_id && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => exportCsv(data.report_id)}
              >
                Xuất báo cáo (CSV)
              </Button>
            )}
            {!data.report_id && data.generated && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setSaveReportModalVisible(true)}
              >
                Lưu báo cáo
              </Button>
            )}
        </Col>
        </Row>
      </div>
    );
  };

  // Hiển thị báo cáo hoạt động
  const renderActivityStatistics = () => {
    const data = statistics.activity;
    
    if (!data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Chưa có báo cáo thống kê hoạt động</p>
          <Button type="primary" onClick={() => generateReport('activity')} loading={loading}>
            Tạo báo cáo
          </Button>
        </div>
      );
    }
    
    // Kiểm tra dữ liệu có tồn tại và có cấu trúc đúng không
    if (!data.data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Không có dữ liệu thống kê hoạt động</p>
          <Button type="primary" onClick={() => generateReport('activity')} loading={loading}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }
    
    // Sử dụng dữ liệu thực từ API
    const caseByType = (data.data.caseByType && data.data.caseByType.length > 0) 
      ? data.data.caseByType 
      : [];
      
    const caseByStatus = (data.data.caseByStatus && data.data.caseByStatus.length > 0) 
      ? data.data.caseByStatus.map(item => ({
          ...item,
          statusVN: item.statusVN || mapStatusToVietnamese(item.status)
        }))
      : [];
      
    const caseByMonth = (data.data.caseByMonth && data.data.caseByMonth.length > 0) 
      ? data.data.caseByMonth 
      : [];
      
    const appointmentByStatus = (data.data.appointmentByStatus && data.data.appointmentByStatus.length > 0) 
      ? data.data.appointmentByStatus.map(item => ({
          ...item,
          statusVN: item.statusVN || mapStatusToVietnamese(item.status)
        }))
      : [];
    
    const appointmentByMonth = (data.data.appointmentByMonth && data.data.appointmentByMonth.length > 0) 
      ? data.data.appointmentByMonth 
      : [];
      
    const topLawyers = (data.data.topLawyers && data.data.topLawyers.length > 0) 
      ? data.data.topLawyers 
      : [];
    
    // Kiểm tra nếu không có dữ liệu nào
    if (caseByType.length === 0 && caseByStatus.length === 0 && caseByMonth.length === 0 && 
        appointmentByStatus.length === 0 && appointmentByMonth.length === 0 && topLawyers.length === 0) {
      return (
        <div className={styles.emptyReport}>
          <Empty description="Không có dữ liệu thống kê hoạt động trong khoảng thời gian này" />
          <Button type="primary" onClick={() => generateReport('activity')} style={{ marginTop: 16 }}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }

    // Tính tổng vụ án
    const totalCases = caseByStatus.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
    
    // Tính tổng cuộc hẹn
    const totalAppointments = appointmentByStatus.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
    
    // Tính số vụ án đang xử lý
    const casesInProgress = caseByStatus.find(item => item.status === 'in_progress')?.count || 0;
    
    // Tính số cuộc hẹn đã xác nhận
    const confirmedAppointments = appointmentByStatus.find(item => item.status === 'confirmed')?.count || 0;
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card className={styles.summaryCard}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileProtectOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{totalCases}</div>
                      <div className={styles.statLabel}>Tổng vụ án</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <ScheduleOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{totalAppointments}</div>
                      <div className={styles.statLabel}>Tổng cuộc hẹn</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileProtectOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{casesInProgress}</div>
                      <div className={styles.statLabel}>Vụ án đang xử lý</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <ScheduleOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{confirmedAppointments}</div>
                      <div className={styles.statLabel}>Cuộc hẹn đã xác nhận</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          
          {caseByType.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo loại" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                      data={caseByType}
                    dataKey="count"
                    nameKey="case_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                  >
                      {caseByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {caseByStatus.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={caseByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="statusVN" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                    <Bar dataKey="count" name="Số lượng" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                      {caseByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {caseByMonth.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={caseByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                    <Area
                    type="monotone"
                    dataKey="count"
                    name="Số lượng"
                    stroke="#8884d8"
                      fill="url(#colorCaseCount)"
                    activeDot={{ r: 8 }}
                  />
                    <defs>
                      <linearGradient id="colorCaseCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {appointmentByStatus.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="Thống kê cuộc hẹn theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                      data={appointmentByStatus}
                    dataKey="count"
                      nameKey="statusVN"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                  >
                      {appointmentByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          )}
          
          {appointmentByMonth.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Thống kê cuộc hẹn theo tháng" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={appointmentByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Số lượng"
                      stroke="#82ca9d"
                      fill="url(#colorAppointmentCount)"
                      activeDot={{ r: 8 }}
                    />
                    <defs>
                      <linearGradient id="colorAppointmentCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
          
          {topLawyers.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Top luật sư có nhiều vụ án nhất" className={styles.tableCard}>
                <Table
                  dataSource={topLawyers}
                  rowKey="lawyer_id"
                  pagination={false}
                  size="small"
                >
                  <Table.Column title="Luật sư" dataIndex="lawyer_name" key="lawyer_name" />
                  <Table.Column
                    title="Số vụ án"
                    dataIndex="case_count"
                    key="case_count"
                    sorter={(a, b) => a.case_count - b.case_count}
                  />
                </Table>
              </Card>
            </Col>
          )}
          
          <Col xs={24} className={styles.actionBar}>
            {data.report_id && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => exportCsv(data.report_id)}
              >
                Xuất báo cáo (CSV)
              </Button>
            )}
            {!data.report_id && data.generated && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setSaveReportModalVisible(true)}
              >
                Lưu báo cáo
              </Button>
            )}
        </Col>
      </Row>
      </div>
    );
  };

  // Hiển thị báo cáo tổng hợp
  const renderComprehensiveReport = () => {
    const data = statistics.comprehensive;
    
    if (!data) {
      return (
        <div className={styles.emptyReport}>
          <FileTextOutlined style={{ fontSize: 48 }} />
          <p>Chưa có báo cáo tổng hợp</p>
          <Button type="primary" onClick={() => generateReport('comprehensive')} loading={loading}>
            Tạo báo cáo tổng hợp
          </Button>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
            Báo cáo tổng hợp hiển thị tất cả dữ liệu trong hệ thống mà không cần chọn khoảng thời gian
          </p>
        </div>
      );
    }
    
    // Lấy dữ liệu thống kê
    const summary = data.data?.summary || {};
    
    // Dữ liệu thống kê người dùng
    const userStatistics = data.data?.userStatistics || {};
    const userRoleData = Array.isArray(userStatistics.userByRole) 
      ? userStatistics.userByRole.map(item => ({
          ...item,
          roleVN: mapRoleToVietnamese(item.role)
        }))
      : [];
    
    // Dữ liệu thống kê tài chính
    const financialStatistics = data.data?.financialStatistics || {};  
    const transactionStatusData = Array.isArray(financialStatistics.transactionByStatus)
      ? financialStatistics.transactionByStatus.map(item => ({
          ...item,
          statusVN: mapStatusToVietnamese(item.status)
        }))
      : [];
    
    // Dữ liệu thống kê hoạt động
    const activityStatistics = data.data?.activityStatistics || {};
    const caseTypeData = Array.isArray(activityStatistics.caseByType)
      ? activityStatistics.caseByType
      : [];
    
    const appointmentStatusData = Array.isArray(activityStatistics.appointmentByStatus)
      ? activityStatistics.appointmentByStatus.map(item => ({
          ...item,
          statusVN: mapStatusToVietnamese(item.status)
        }))
      : [];
    
    // Kiểm tra nếu không có dữ liệu nào thực sự
    const hasNoData = Object.keys(summary).length === 0 && 
                      userRoleData.length === 0 && 
                      transactionStatusData.length === 0 && 
                      caseTypeData.length === 0 && 
                      appointmentStatusData.length === 0;
    
    if (hasNoData) {
      return (
        <div className={styles.emptyReport}>
          <Empty description="Không có dữ liệu báo cáo tổng hợp" />
          <Button type="primary" onClick={() => generateReport('comprehensive')} style={{ marginTop: 16 }}>
            Tạo lại báo cáo
          </Button>
        </div>
      );
    }
    
    // Dữ liệu để hiển thị trên biểu đồ cột
    const summaryChartData = [
      { name: 'Người dùng', value: summary.totalUsers || summary.totalusers || summary.total_users || 0 },
      { name: 'Luật sư', value: summary.totalLawyers || summary.totallawyers || summary.total_lawyers || 0 },
      { name: 'Vụ án', value: summary.totalCases || summary.totalcases || summary.total_cases || 0 },
      { name: 'Cuộc hẹn', value: summary.totalAppointments || summary.totalappointments || summary.total_appointments || 0 },
      { name: 'Hợp đồng', value: summary.totalContracts || summary.totalcontracts || summary.total_contracts || 0 },
      { name: 'Tài liệu', value: summary.totalDocs || summary.totaldocs || summary.total_documents || 0 },
      { name: 'Tư vấn AI', value: summary.totalAIConsultations || summary.totalconsultations || 0 }
    ].filter(item => item.value > 0);
    
    // Tính tổng doanh thu từ dữ liệu giao dịch
    const totalRevenue = summary.completedAmount || summary.completedamount || summary.total_transaction_amount ||
                         transactionStatusData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card className={styles.summaryCard}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <UserOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {summary.totalUsers || summary.totalusers || summary.total_users || 0}
                      </div>
                      <div className={styles.statLabel}>Người dùng</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <TeamOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {summary.totalLawyers || summary.totallawyers || summary.total_lawyers || 0}
                      </div>
                      <div className={styles.statLabel}>Luật sư</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileProtectOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {summary.totalCases || summary.totalcases || summary.total_cases || 0}
                      </div>
                      <div className={styles.statLabel}>Vụ án</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <DollarOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {formatCurrency(totalRevenue)}
                      </div>
                      <div className={styles.statLabel}>Doanh thu</div>
                    </div>
                  </div>
                </Col>
              </Row>
          </Card>
        </Col>
          
          {summaryChartData.length > 0 && (
            <Col xs={24}>
              <Card title="Thống kê số lượng theo danh mục" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={summaryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Số lượng" fill="#8884d8" radius={[0, 4, 4, 0]}>
                      {summaryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
          
          {userRoleData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố người dùng theo vai trò" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        dataKey="count"
                        nameKey="roleVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    <Legend />
                    </PieChart>
                  </ResponsiveContainer>
              </Card>
            </Col>
          )}
          
          {transactionStatusData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố giao dịch theo trạng thái" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={transactionStatusData}
                        dataKey="total_amount"
                        nameKey="statusVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      >
                        {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    </PieChart>
                  </ResponsiveContainer>
          </Card>
        </Col>
          )}

          {caseTypeData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố vụ án theo loại" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={caseTypeData}
                        dataKey="count"
                        nameKey="case_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      >
                        {caseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    <Legend />
                    </PieChart>
                  </ResponsiveContainer>
          </Card>
        </Col>
          )}

          {appointmentStatusData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố cuộc hẹn theo trạng thái" className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        dataKey="count"
                        nameKey="statusVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      >
                        {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 6) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                    <Legend />
                    </PieChart>
                  </ResponsiveContainer>
          </Card>
            </Col>
          )}
          
          <Col xs={24} className={styles.actionBar}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                try {
                  // Chuẩn bị dữ liệu CSV với BOM UTF-8 để đảm bảo Excel hiểu đúng encoding
                  const BOM = '\uFEFF'; // Byte Order Mark để xác định encoding UTF-8
                  
                  // Tạo dữ liệu CSV với định dạng UTF-8
                  const csvData = BOM + 
                    `Thống kê tổng quan hệ thống\n` +
                    `Người dùng,${summary.totalUsers || summary.totalusers || summary.total_users || 0}\n` +
                    `Luật sư,${summary.totalLawyers || summary.totallawyers || summary.total_lawyers || 0}\n` +
                    `Vụ án,${summary.totalCases || summary.totalcases || summary.total_cases || 0}\n` +
                    `Doanh thu,${totalRevenue}\n\n` +
                    `Thống kê chi tiết\n` +
                    userRoleData.map(item => `${item.roleVN},${item.count}`).join('\n');
                  
                  // Tạo blob với đúng encoding
                  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  
                  // Tạo link tải xuống
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `Bao_cao_tong_hop_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  message.success('Đã xuất báo cáo CSV thành công');
                } catch (error) {
                  console.error('Lỗi khi xuất CSV:', error);
                  message.error('Không thể xuất báo cáo CSV');
                }
              }}
            >
              Xuất báo cáo (CSV)
            </Button>
            
            {data.report_id && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => exportCsv(data.report_id)}
                style={{ marginLeft: 16 }}
              >
                Xuất báo cáo từ server (CSV)
              </Button>
            )}
            {!data.report_id && data.generated && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setSaveReportModalVisible(true)}
                style={{ marginLeft: 16 }}
              >
                Lưu báo cáo
              </Button>
            )}
        </Col>
      </Row>
      </div>
    );
  };

  // Tạo báo cáo thống kê tổng hợp
  const generateComprehensiveReport = async () => {
    try {
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi generateComprehensiveReport');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setLoading(true);
      
      console.log('StatisticalReport - Đang tạo báo cáo tổng hợp');
      
      try {
        // Gọi API để lấy báo cáo tổng hợp từ backend
        const response = await statisticsService.generateComprehensiveReport();
        
        if (response && response.status === 'success') {
          console.log('StatisticalReport - Kết quả tạo báo cáo tổng hợp từ API:', response);
          
          // Cập nhật state với dữ liệu từ API
          setStatistics({
            ...statistics,
            comprehensive: {
              data: response.data,
              generated: true
            }
          });
          
          message.success('Đã tạo báo cáo tổng hợp thành công');
          
          // Hiện modal lưu báo cáo
          setSaveReportModalVisible(true);
          
          return response;
        } else {
          throw new Error(response?.message || 'Không nhận được dữ liệu hợp lệ từ máy chủ');
        }
      } catch (apiError) {
        console.error('Lỗi khi gọi API tạo báo cáo tổng hợp:', apiError);
        
        // Tạo dữ liệu mẫu trong trường hợp có lỗi
        const sampleData = {
          summary: {
            total_users: 125,
            total_lawyers: 35,
            total_cases: 78,
            total_appointments: 156,
            total_transactions: 89,
            total_transaction_amount: 45000000,
            total_contracts: 67,
            total_documents: 120,
            total_chats: 250
          },
          userStatistics: {
            userByRole: [
              { role: 'admin', count: 5 },
              { role: 'lawyer', count: 35 },
              { role: 'client', count: 80 },
              { role: 'staff', count: 5 }
            ]
          },
          financialStatistics: {
            transactionByStatus: [
              { status: 'completed', total_amount: 35000000, count: 65 },
              { status: 'pending', total_amount: 8000000, count: 20 },
              { status: 'failed', total_amount: 2000000, count: 4 }
            ]
          },
          activityStatistics: {
            caseByType: [
              { case_type: 'Dân sự', count: 30 },
              { case_type: 'Hình sự', count: 15 },
              { case_type: 'Hành chính', count: 10 },
              { case_type: 'Thương mại', count: 23 }
            ],
            appointmentByStatus: [
              { status: 'confirmed', count: 95 },
              { status: 'pending', count: 40 },
              { status: 'cancelled', count: 15 },
              { status: 'completed', count: 6 }
            ]
          }
        };
        
        console.log('StatisticalReport - Sử dụng dữ liệu mẫu vì lỗi API:', sampleData);
        
        // Cập nhật state
        setStatistics({
          ...statistics,
          comprehensive: {
            data: sampleData,
            generated: true,
            isSampleData: true
          }
        });
        
        message.info('Đang sử dụng dữ liệu mẫu do không thể kết nối đến API');
        
        // Hiện modal lưu báo cáo
        setSaveReportModalVisible(true);
        
        return { status: 'success', data: sampleData };
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi tạo báo cáo tổng hợp:', error);
      
      // Hiển thị thông báo lỗi chi tiết
      const errorMessage = error.message || 'Không thể tạo báo cáo tổng hợp';
      message.error(errorMessage);
      
      // Cập nhật state để hiển thị Empty khi không có dữ liệu
      setStatistics({
        ...statistics,
        comprehensive: {
          data: null,
          generated: true,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card>
        <Title level={4}>Báo cáo thống kê</Title>
        
        <div className={styles.filterBar}>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            disabled={activeTab === 'comprehensive'}
            style={{ minWidth: '240px' }}
            placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
          />
          
            <Button 
            type="primary" 
            onClick={() => generateReport(activeTab)}
            loading={loading}
            icon={activeTab === 'comprehensive' ? <BarChartOutlined /> : <LineChartOutlined />}
            disabled={(activeTab !== 'comprehensive' && (!dateRange[0] || !dateRange[1]))}
          >
            Tạo báo cáo {activeTab === 'comprehensive' ? 'tổng hợp' : ''}
            </Button>
        </div>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab} className={styles.tabs}>
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Người dùng
              </span>
            }
            key="user"
          >
            {renderUserStatistics()}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <DollarOutlined />
                Tài chính
              </span>
            }
            key="financial"
          >
            {renderFinancialStatistics()}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Hoạt động
              </span>
            }
            key="activity"
          >
            {renderActivityStatistics()}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <PieChartOutlined />
                Tổng hợp
              </span>
            }
            key="comprehensive"
          >
            {renderComprehensiveReport()}
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Modal lưu báo cáo */}
      <Modal
        title="Lưu báo cáo"
        visible={saveReportModalVisible}
        onCancel={() => setSaveReportModalVisible(false)}
        footer={null}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleSaveReport}
          initialValues={{
            report_name: `Báo cáo ${
              activeTab === 'user' ? 'người dùng' :
              activeTab === 'financial' ? 'tài chính' :
              activeTab === 'activity' ? 'hoạt động' : 'tổng hợp'
            } ${dateRange[0] && dateRange[1] ? `từ ${dateRange[0].format('DD/MM/YYYY')} đến ${dateRange[1].format('DD/MM/YYYY')}` : ''}`,
          }}
        >
          <Form.Item
            name="report_name"
            label="Tên báo cáo"
            rules={[{ required: true, message: 'Vui lòng nhập tên báo cáo' }]}
          >
            <Input placeholder="Nhập tên báo cáo" />
          </Form.Item>
          
          <div className={styles.modalButtons}>
            <Button onClick={() => setSaveReportModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

// Xuất component để sử dụng trong các file khác
export default StatisticalReport;
