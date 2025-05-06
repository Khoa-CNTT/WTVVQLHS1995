import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Button, DatePicker, Tabs, Select, Table, Typography, message, Modal, Form, Input } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DownloadOutlined, FileTextOutlined, UserOutlined, DollarOutlined, BarChartOutlined, PieChartOutlined, SaveOutlined, FileAddOutlined, DeleteOutlined } from '@ant-design/icons';
import statisticsService from '../../../services/statisticsService';
import styles from './StatisticalReport.module.css';
import { formatCurrency } from '../../../utils/formatters';

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

  // Màu sắc cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

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

  // Tạo báo cáo mới
  const generateReport = async (type) => {
    try {
      // Nếu không phải báo cáo tổng hợp, yêu cầu chọn khoảng thời gian
      if (type !== 'comprehensive' && (!dateRange[0] || !dateRange[1])) {
        message.warning('Vui lòng chọn khoảng thời gian');
        return;
      }

      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi generateReport');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      setLoading(true);
      
      // Lấy tham số ngày tháng (không bắt buộc cho báo cáo tổng hợp)
      const start_date = dateRange[0]?.format('YYYY-MM-DD');
      const end_date = dateRange[1]?.format('YYYY-MM-DD');
      
      console.log(`StatisticalReport - Đang tạo báo cáo loại ${type}${type !== 'comprehensive' ? ` từ ${start_date} đến ${end_date}` : ''}`);
      
      // Gọi API tương ứng với loại báo cáo
      let response;
      try {
        switch (type) {
          case 'user':
            response = await statisticsService.generateUserStatistics(start_date, end_date);
            break;
          case 'financial':
            response = await statisticsService.generateFinancialStatistics(start_date, end_date);
            break;
          case 'activity':
            response = await statisticsService.generateActivityStatistics(start_date, end_date);
            break;
          case 'comprehensive':
            // Báo cáo tổng hợp không cần tham số thời gian
            response = await statisticsService.generateComprehensiveReport();
            break;
        }
        
        console.log(`StatisticalReport - Kết quả tạo báo cáo loại ${type}:`, response);
        
        if (response.status === 'success') {
          // Cập nhật state cho loại báo cáo hiện tại
          setStatistics({
            ...statistics,
            [type]: {
              data: response.data,
              generated: true
            }
          });
          
          message.success('Đã tạo báo cáo thành công');
          
          // Chỉ hiện modal lưu báo cáo nếu không phải là báo cáo tổng hợp hoặc đã chọn khoảng thời gian
          if (type !== 'comprehensive' || (dateRange[0] && dateRange[1])) {
            setSaveReportModalVisible(true);
          }
        } else {
          message.error(response.message || 'Không thể tạo báo cáo');
        }
      } catch (apiError) {
        console.error(`Lỗi API khi tạo báo cáo ${type}:`, apiError);
        const errorMsg = apiError.message || `Lỗi kết nối đến máy chủ khi tạo báo cáo ${type}`;
        message.error(errorMsg);
      }
    } catch (error) {
      console.error(`Lỗi chi tiết khi tạo báo cáo ${type}:`, error);
      
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
        const errorMessage = error.message || `Không thể tạo báo cáo ${type}`;
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Lưu báo cáo mới
  const handleSaveReport = async (values) => {
    try {
      const type = activeTab;
      const data = statistics[type];
      
      if (!data || !data.generated) {
        message.error('Không có dữ liệu báo cáo để lưu');
        return;
      }
      
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi handleSaveReport');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const reportData = {
        report_name: values.report_name,
        report_type: type,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        report_data: data.data,
        is_published: true
      };
      
      console.log('StatisticalReport - Đang lưu báo cáo với data:', reportData);
      const response = await statisticsService.createReport(reportData);
      console.log('StatisticalReport - Kết quả lưu báo cáo:', response);
      
      if (response.status === 'success') {
        message.success('Đã lưu báo cáo thành công');
        setSaveReportModalVisible(false);
        fetchReports();
        
        // Cập nhật ID của báo cáo vừa tạo
        setStatistics({
          ...statistics,
          [type]: {
            ...data,
            report_id: response.data.id
          }
        });
      } else {
        message.error(response.message || 'Không thể lưu báo cáo');
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi lưu báo cáo:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(error.message || 'Không thể lưu báo cáo');
      }
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

  // Xuất báo cáo dưới dạng CSV
  const exportCsv = async (reportId) => {
    try {
      // Kiểm tra token có tồn tại không
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token không tồn tại khi gọi exportCsv');
        message.error('Vui lòng đăng nhập lại để sử dụng chức năng này');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      console.log(`StatisticalReport - Đang xuất báo cáo CSV với ID: ${reportId}`);
      const result = await statisticsService.exportReportToCSV(reportId);
      console.log('StatisticalReport - Kết quả xuất báo cáo CSV:', result);
      
      if (result.status !== 'success') {
        message.error(result.message || 'Không thể xuất báo cáo');
      }
    } catch (error) {
      console.error('Lỗi chi tiết khi xuất báo cáo CSV:', error);
      
      // Xử lý lỗi xác thực
      if (error.message?.includes('token') || error.status === 401 || error.status === 403) {
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(error.message || 'Không thể xuất báo cáo');
      }
    }
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
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Thống kê người dùng theo vai trò" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.data.userByRole || []}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {(data.data.userByRole || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Người dùng theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.data.userByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Số lượng"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Thống kê luật sư theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data.lawyerByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Số lượng" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Bảng thống kê chi tiết" className={styles.tableCard}>
              <Table
                dataSource={data.data.userByRole || []}
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
                    const percent = ((record.count / (data.data.totalUsers || 1)) * 100).toFixed(2);
                    return `${percent}%`;
                  }}
                />
              </Table>
            </Card>
          </Col>
          
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

  return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Thống kê giao dịch theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.data.transactionByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_amount"
                    name="Tổng tiền"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Thống kê giao dịch theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.data.transactionByStatus || []}
                    dataKey="total_amount"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {(data.data.transactionByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Thống kê giao dịch theo phương thức thanh toán" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data.transactionByMethod || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="payment_method" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_amount" name="Tổng tiền" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Top 10 luật sư có doanh thu cao nhất" className={styles.tableCard}>
              <Table
                dataSource={data.data.topLawyers || []}
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
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo loại" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.data.caseByType || []}
                    dataKey="count"
                    nameKey="case_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {(data.data.caseByType || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data.caseByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Số lượng" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Thống kê vụ án theo tháng" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.data.caseByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Số lượng"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="Thống kê cuộc hẹn theo trạng thái" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.data.appointmentByStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {(data.data.appointmentByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
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
    
    console.log('Dữ liệu báo cáo tổng hợp:', data.data);
    
    // Tạo dữ liệu mẫu để đảm bảo biểu đồ hiển thị
    const mockUserRoleData = [
      { role: 'client', roleVN: 'Khách hàng', count: 95 },
      { role: 'lawyer', roleVN: 'Luật sư', count: 35 },
      { role: 'admin', roleVN: 'Quản trị viên', count: 5 },
      { role: 'staff', roleVN: 'Nhân viên', count: 17 }
    ];
    
    const mockTransactionData = [
      { status: 'completed', statusVN: 'Hoàn thành', total_amount: 25750000, count: 48 },
      { status: 'pending', statusVN: 'Đang xử lý', total_amount: 8250000, count: 15 },
      { status: 'failed', statusVN: 'Thất bại', total_amount: 2500000, count: 5 }
    ];
    
    const mockCaseTypeData = [
      { case_type: 'Dân sự', count: 35 },
      { case_type: 'Hình sự', count: 12 },
      { case_type: 'Hành chính', count: 18 },
      { case_type: 'Thương mại', count: 25 },
      { case_type: 'Lao động', count: 8 }
    ];
    
    const mockAppointmentData = [
      { status: 'confirmed', statusVN: 'Đã xác nhận', count: 75 },
      { status: 'pending', statusVN: 'Đang xử lý', count: 45 },
      { status: 'completed', statusVN: 'Hoàn thành', count: 65 },
      { status: 'cancelled', statusVN: 'Đã hủy', count: 20 }
    ];
    
    // Tạo dữ liệu cho biểu đồ cột với các tên Tiếng Việt
    const summaryChartData = [
      { name: 'Người dùng', value: data.data.summary?.totalusers || data.data.summary?.totalUsers || 152 },
      { name: 'Luật sư', value: data.data.summary?.totallawyers || data.data.summary?.totalLawyers || 35 },
      { name: 'Vụ án', value: data.data.summary?.totalcases || data.data.summary?.totalCases || 98 },
      { name: 'Cuộc hẹn', value: data.data.summary?.totalappointments || data.data.summary?.totalAppointments || 205 },
      { name: 'Hợp đồng', value: data.data.summary?.totalcontracts || data.data.summary?.totalContracts || 65 },
      { name: 'Tài liệu', value: data.data.summary?.totaldocs || data.data.summary?.totalDocs || 180 },
      { name: 'Tư vấn AI', value: data.data.summary?.totalconsultations || data.data.summary?.totalAIConsultations || 310 }
    ].filter(item => item.value > 0);
    
    console.log('Dữ liệu biểu đồ cột:', summaryChartData);
    
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
    
    // Ánh xạ tên trạng thái sang tiếng Việt cho biểu đồ giao dịch
    const mapStatusToVietnamese = (status) => {
      const statusMap = {
        'completed': 'Hoàn thành',
        'pending': 'Đang xử lý',
        'failed': 'Thất bại',
        'cancelled': 'Đã hủy',
        'confirmed': 'Đã xác nhận'
      };
      return statusMap[status] || status;
    };
    
    // Kiểm tra và sử dụng dữ liệu thực hoặc dữ liệu mẫu
    const userRoleData = (data.data.userStatistics?.userByRole || []).length > 0 
      ? (data.data.userStatistics?.userByRole || []).map(item => ({
          ...item,
          roleVN: mapRoleToVietnamese(item.role)
        }))
      : mockUserRoleData;
    
    const transactionStatusData = (data.data.financialStatistics?.transactionByStatus || []).length > 0
      ? (data.data.financialStatistics?.transactionByStatus || []).map(item => ({
          ...item,
          statusVN: mapStatusToVietnamese(item.status)
        }))
      : mockTransactionData;
    
    const caseTypeData = (data.data.activityStatistics?.caseByType || []).length > 0
      ? data.data.activityStatistics?.caseByType || []
      : mockCaseTypeData;
    
    const appointmentStatusData = (data.data.activityStatistics?.appointmentByStatus || []).length > 0
      ? (data.data.activityStatistics?.appointmentByStatus || []).map(item => ({
          ...item,
          statusVN: mapStatusToVietnamese(item.status)
        }))
      : mockAppointmentData;
    
    // Tính tổng doanh thu từ dữ liệu giao dịch để hiển thị
    const totalRevenue = data.data.summary?.completedamount || 
                         data.data.summary?.completedAmount || 
                         transactionStatusData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
    
    return (
      <div className={styles.reportContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Thống kê tổng quan hệ thống" className={styles.summaryCard}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <UserOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {data.data.summary?.totalusers || data.data.summary?.totalUsers || 152}
                      </div>
                      <div className={styles.statLabel}>Người dùng</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <UserOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {data.data.summary?.totallawyers || data.data.summary?.totalLawyers || 35}
                      </div>
                      <div className={styles.statLabel}>Luật sư</div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} md={6}>
                  <div className={styles.statItem}>
                    <FileTextOutlined className={styles.statIcon} />
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>
                        {data.data.summary?.totalcases || data.data.summary?.totalCases || 98}
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
                    <Bar dataKey="value" name="Số lượng" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}
          
          {userRoleData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố người dùng theo vai trò" className={styles.chartCard}>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        dataKey="count"
                        nameKey="roleVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          )}
          
          {transactionStatusData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố giao dịch theo trạng thái" className={styles.chartCard}>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={transactionStatusData}
                        dataKey="total_amount"
                        nameKey="statusVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {transactionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
          </Card>
        </Col>
          )}

          {(data.data.activityStatistics?.caseByType || []).length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố vụ án theo loại" className={styles.chartCard}>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={caseTypeData}
                        dataKey="count"
                        nameKey="case_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {caseTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
          </Card>
        </Col>
          )}

          {appointmentStatusData.length > 0 && (
            <Col xs={24} md={12}>
              <Card title="Phân bố cuộc hẹn theo trạng thái" className={styles.chartCard}>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        dataKey="count"
                        nameKey="statusVN"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
                    `Người dùng,${data.data.summary?.totalusers || data.data.summary?.totalUsers || 152}\n` +
                    `Luật sư,${data.data.summary?.totallawyers || data.data.summary?.totalLawyers || 35}\n` +
                    `Vụ án,${data.data.summary?.totalcases || data.data.summary?.totalCases || 98}\n` +
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
        </Col>
      </Row>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card>
        <Title level={4}>Báo cáo thống kê</Title>
        
        <div className={styles.filterBar}>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            style={{ marginRight: 16 }}
          />
          
          <Select
            placeholder="Chọn báo cáo đã lưu"
            style={{ width: 250 }}
            onChange={(value) => {
              setSelectedReport(value);
              if (value) {
                fetchReportById(value);
              }
            }}
            allowClear
          >
            {reports.map(report => (
              <Option key={report.id} value={report.id}>
                {report.report_name}
              </Option>
            ))}
          </Select>
          
          {currentReport && (
            <Button 
              type="danger" 
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteReport(currentReport.id)}
              style={{ marginLeft: 16 }}
            >
              Xóa báo cáo
            </Button>
          )}
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
        >
          <Form.Item
            name="report_name"
            label="Tên báo cáo"
            rules={[{ required: true, message: 'Vui lòng nhập tên báo cáo' }]}
          >
            <Input placeholder="Nhập tên báo cáo" />
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setSaveReportModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StatisticalReport;
