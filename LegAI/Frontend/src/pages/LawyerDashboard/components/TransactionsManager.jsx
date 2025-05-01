import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Typography, Tag, Button, Space, Row, 
  Col, Statistic, DatePicker, Select, Modal, Form, 
  Input, notification, Tooltip, Badge, Tabs
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  DollarOutlined, BankOutlined, EyeOutlined,
  CalendarOutlined, ExclamationCircleOutlined, PlusOutlined
} from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import legalCaseService from '../../../services/legalCaseService';
import moment from 'moment';
import styles from './TransactionsManager.module.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { confirm } = Modal;

const TransactionsManager = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    dateRange: [],
    searchText: ''
  });
  const [stats, setStats] = useState({
    total_transactions: 0,
    completed_transactions: 0,
    pending_transactions: 0,
    total_amount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    transaction: null
  });
  const [confirmForm] = Form.useForm();
  const [addBankAccountModal, setAddBankAccountModal] = useState(false);
  const [bankAccountForm] = Form.useForm();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    fetchFinancialStats();
    fetchTransactions();
    fetchBankAccounts();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchFinancialStats = async () => {
    try {
      const params = {};
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await transactionService.getLawyerFinancialStats(params);
      
      if (response && response.success) {
        setStats(response.data.stats || {});
        setRecentTransactions(response.data.recentTransactions || []);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tài chính:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      
      if (filters.status) {
        params.status = filters.status;
      }
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await transactionService.getLawyerTransactions(params);
      
      if (response && response.success) {
        // Lọc kết quả nếu có tìm kiếm
        let filteredTransactions = response.data.transactions || [];
        
        if (filters.searchText && filters.searchText.trim() !== '') {
          const searchLower = filters.searchText.toLowerCase();
          filteredTransactions = filteredTransactions.filter(item => 
            (item.user_name && item.user_name.toLowerCase().includes(searchLower)) ||
            (item.case_title && item.case_title.toLowerCase().includes(searchLower)) ||
            (item.description && item.description.toLowerCase().includes(searchLower))
          );
        }
        
        setTransactions(filteredTransactions);
        setPagination({
          ...pagination,
          total: response.data.total || filteredTransactions.length
        });
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách giao dịch:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const response = await transactionService.getLawyerBankAccounts();
      
      if (response && response.success) {
        setBankAccounts(response.data || []);
      } else {
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài khoản ngân hàng:', error);
      setBankAccounts([]);
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleStatusFilterChange = (value) => {
    setFilters({
      ...filters,
      status: value
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const handleDateRangeChange = (dates) => {
    setFilters({
      ...filters,
      dateRange: dates
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      searchText: value
    });
  };

  const handleRefresh = () => {
    fetchFinancialStats();
    fetchTransactions();
  };

  const handleViewTransaction = (transactionId) => {
    // Mở modal xem chi tiết giao dịch
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      // Hiển thị chi tiết giao dịch
      Modal.info({
        title: 'Chi tiết giao dịch',
        width: 600,
        content: (
          <div className={styles.transactionDetail}>
            <Paragraph>
              <Text strong>Mã giao dịch:</Text> {transaction.id}
            </Paragraph>
            <Paragraph>
              <Text strong>Khách hàng:</Text> {transaction.user_name}
            </Paragraph>
            <Paragraph>
              <Text strong>Vụ án:</Text> {transaction.case_title}
            </Paragraph>
            <Paragraph>
              <Text strong>Số tiền:</Text> {formatCurrency(transaction.amount)}
            </Paragraph>
            <Paragraph>
              <Text strong>Phương thức thanh toán:</Text> {formatPaymentMethod(transaction.payment_method)}
            </Paragraph>
            <Paragraph>
              <Text strong>Trạng thái:</Text> {renderStatus(transaction.status)}
            </Paragraph>
            <Paragraph>
              <Text strong>Ngày tạo:</Text> {moment(transaction.created_at).format('DD/MM/YYYY HH:mm')}
            </Paragraph>
            {transaction.confirmation_date && (
              <Paragraph>
                <Text strong>Ngày xác nhận:</Text> {moment(transaction.confirmation_date).format('DD/MM/YYYY HH:mm')}
              </Paragraph>
            )}
            {transaction.confirmation_notes && (
              <Paragraph>
                <Text strong>Ghi chú xác nhận:</Text> {transaction.confirmation_notes}
              </Paragraph>
            )}
          </div>
        ),
        onOk() {},
      });
    }
  };

  const handleConfirmPayment = (transaction) => {
    setConfirmModal({
      visible: true,
      transaction
    });
    confirmForm.setFieldsValue({
      notes: '',
      updateCaseStatus: true
    });
  };

  const submitConfirmPayment = async (values) => {
    if (!confirmModal.transaction) return;
    
    try {
      const response = await transactionService.confirmPaymentByLawyer(
        confirmModal.transaction.id,
        values
      );
      
      if (response && response.success) {
        notification.success({
          message: 'Xác nhận thanh toán thành công',
          description: 'Giao dịch đã được xác nhận thành công.'
        });
        
        // Đóng modal và làm mới dữ liệu
        setConfirmModal({
          visible: false,
          transaction: null
        });
        confirmForm.resetFields();
        
        // Làm mới dữ liệu
        fetchFinancialStats();
        fetchTransactions();
      } else {
        notification.error({
          message: 'Xác nhận thanh toán thất bại',
          description: response.message || 'Không thể xác nhận thanh toán.'
        });
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận thanh toán:', error);
      notification.error({
        message: 'Xác nhận thanh toán thất bại',
        description: 'Có lỗi xảy ra khi xác nhận thanh toán.'
      });
    }
  };

  const openAddBankAccountModal = () => {
    setAddBankAccountModal(true);
    bankAccountForm.resetFields();
  };

  const handleAddBankAccount = async (values) => {
    try {
      const response = await transactionService.addBankAccount(values);
      
      if (response && response.success) {
        notification.success({
          message: 'Thêm tài khoản ngân hàng thành công',
          description: 'Tài khoản ngân hàng mới đã được thêm thành công.'
        });
        
        // Đóng modal và làm mới dữ liệu
        setAddBankAccountModal(false);
        bankAccountForm.resetFields();
        
        // Làm mới danh sách tài khoản ngân hàng
        fetchBankAccounts();
      } else {
        notification.error({
          message: 'Thêm tài khoản ngân hàng thất bại',
          description: response.message || 'Không thể thêm tài khoản ngân hàng.'
        });
      }
    } catch (error) {
      console.error('Lỗi khi thêm tài khoản ngân hàng:', error);
      notification.error({
        message: 'Thêm tài khoản ngân hàng thất bại',
        description: 'Có lỗi xảy ra khi thêm tài khoản ngân hàng.'
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return `${parseInt(amount).toLocaleString('vi-VN')} VNĐ`;
  };

  const formatPaymentMethod = (method) => {
    const methods = {
      credit_card: 'Thẻ tín dụng/Ghi nợ',
      bank_transfer: 'Chuyển khoản ngân hàng',
      e_wallet: 'Ví điện tử',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
      cash: 'Tiền mặt'
    };
    
    return methods[method] || method;
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">Đang chờ</Tag>;
      case 'processing':
        return <Tag color="blue">Đang xử lý</Tag>;
      case 'completed':
        return <Tag color="green">Hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'id',
      key: 'id',
      render: id => <Text strong>#{id}</Text>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'user_name',
      key: 'user_name'
    },
    {
      title: 'Vụ án',
      dataIndex: 'case_title',
      key: 'case_title',
      ellipsis: true
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => formatCurrency(amount)
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: method => formatPaymentMethod(method)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => renderStatus(status)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewTransaction(record.id)}
            />
          </Tooltip>
          
          {record.status === 'pending' && (
            <Tooltip title="Xác nhận thanh toán">
              <Button 
                type="primary" 
                shape="circle" 
                icon={<CheckCircleOutlined />} 
                size="small"
                onClick={() => handleConfirmPayment(record)}
                className={styles.confirmButton}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className={styles.transactionsManager}>
      <div className={styles.header}>
        <Title level={4}>Quản lý thanh toán</Title>
        <Space>
          <Button type="primary" onClick={handleRefresh}>
            Làm mới
          </Button>
        </Space>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tổng quan" key="overview">
          <div className={styles.overview}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card className={styles.statCard}>
                  <Statistic
                    title="Tổng số giao dịch"
                    value={stats.total_transactions || 0}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className={styles.statCard}>
                  <Statistic
                    title="Giao dịch hoàn thành"
                    value={stats.completed_transactions || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className={styles.statCard}>
                  <Statistic
                    title="Giao dịch chờ xác nhận"
                    value={stats.pending_transactions || 0}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className={styles.statCard}>
                  <Statistic
                    title="Tổng số tiền"
                    value={parseInt(stats.total_amount) || 0}
                    prefix={<span>₫</span>}
                    suffix="VNĐ"
                    precision={0}
                    formatter={value => value.toLocaleString('vi-VN')}
                  />
                </Card>
              </Col>
            </Row>
            
            <Card 
              title="Giao dịch gần đây" 
              className={styles.recentTransactions}
              extra={
                <Button type="link" onClick={() => setActiveTab('transactions')}>
                  Xem tất cả
                </Button>
              }
            >
              {recentTransactions.length > 0 ? (
                <Table
                  dataSource={recentTransactions}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <div className={styles.emptyState}>
                  <Text>Không có giao dịch gần đây</Text>
                </div>
              )}
            </Card>
          </div>
        </TabPane>
        
        <TabPane tab="Danh sách giao dịch" key="transactions">
          <div className={styles.filterSection}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input.Search
                  placeholder="Tìm theo khách hàng, vụ án"
                  value={filters.searchText}
                  onChange={handleSearchChange}
                  onSearch={value => {
                    setFilters({ ...filters, searchText: value });
                    setPagination({ ...pagination, current: 1 });
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Trạng thái"
                  style={{ width: '100%' }}
                  value={filters.status}
                  onChange={handleStatusFilterChange}
                  allowClear
                >
                  <Option value="pending">Đang chờ</Option>
                  <Option value="processing">Đang xử lý</Option>
                  <Option value="completed">Hoàn thành</Option>
                  <Option value="cancelled">Đã hủy</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={filters.dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Button
                  type="primary"
                  onClick={handleRefresh}
                  style={{ width: '100%' }}
                >
                  Làm mới
                </Button>
              </Col>
            </Row>
          </div>
          
          <Table
            dataSource={transactions}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: total => `Tổng cộng ${total} giao dịch`
            }}
            onChange={handleTableChange}
            bordered
          />
        </TabPane>
        
        <TabPane tab="Tài khoản ngân hàng" key="bank-accounts">
          <div className={styles.bankAccountsSection}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openAddBankAccountModal}
                >
                  Thêm tài khoản ngân hàng
                </Button>
              </Col>
              
              {loadingBankAccounts ? (
                <Col xs={24}>
                  <div className={styles.loadingState}>Đang tải...</div>
                </Col>
              ) : bankAccounts.length > 0 ? (
                bankAccounts.map(account => (
                  <Col xs={24} sm={12} md={8} key={account.id}>
                    <Card className={styles.bankAccountCard}>
                      <div className={styles.bankAccountHeader}>
                        <BankOutlined className={styles.bankIcon} />
                        {account.is_default && (
                          <Badge
                            count="Mặc định"
                            className={styles.defaultBadge}
                            style={{ backgroundColor: '#108ee9' }}
                          />
                        )}
                      </div>
                      <Paragraph>
                        <Text strong>Ngân hàng:</Text> {account.bank_name}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Số tài khoản:</Text> {account.account_number}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Chủ tài khoản:</Text> {account.account_holder}
                      </Paragraph>
                      {account.branch && (
                        <Paragraph>
                          <Text strong>Chi nhánh:</Text> {account.branch}
                        </Paragraph>
                      )}
                    </Card>
                  </Col>
                ))
              ) : (
                <Col xs={24}>
                  <Card className={styles.emptyBankAccountCard}>
                    <div className={styles.emptyState}>
                      <BankOutlined className={styles.emptyIcon} />
                      <Text>Bạn chưa có tài khoản ngân hàng nào</Text>
                      <Button
                        type="primary"
                        onClick={openAddBankAccountModal}
                      >
                        Thêm tài khoản ngân hàng
                      </Button>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        </TabPane>
      </Tabs>
      
      {/* Modal xác nhận thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        visible={confirmModal.visible}
        onCancel={() => setConfirmModal({ visible: false, transaction: null })}
        footer={null}
      >
        {confirmModal.transaction && (
          <Form
            form={confirmForm}
            layout="vertical"
            onFinish={submitConfirmPayment}
          >
            <Paragraph>
              <Text>Bạn đang xác nhận đã nhận được thanh toán cho giao dịch:</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Vụ án:</Text> {confirmModal.transaction.case_title}
            </Paragraph>
            <Paragraph>
              <Text strong>Khách hàng:</Text> {confirmModal.transaction.user_name}
            </Paragraph>
            <Paragraph>
              <Text strong>Số tiền:</Text> {formatCurrency(confirmModal.transaction.amount)}
            </Paragraph>
            
            <Form.Item
              name="notes"
              label="Ghi chú xác nhận"
            >
              <Input.TextArea rows={4} placeholder="Nhập ghi chú xác nhận (không bắt buộc)" />
            </Form.Item>
            
            <Form.Item
              name="updateCaseStatus"
              valuePropName="checked"
            >
              <Checkbox defaultChecked>Đánh dấu vụ án đã hoàn thành</Checkbox>
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button
                  type="default"
                  onClick={() => setConfirmModal({ visible: false, transaction: null })}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                >
                  Xác nhận thanh toán
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* Modal thêm tài khoản ngân hàng */}
      <Modal
        title="Thêm tài khoản ngân hàng"
        visible={addBankAccountModal}
        onCancel={() => setAddBankAccountModal(false)}
        footer={null}
      >
        <Form
          form={bankAccountForm}
          layout="vertical"
          onFinish={handleAddBankAccount}
        >
          <Form.Item
            name="bank_name"
            label="Tên ngân hàng"
            rules={[{ required: true, message: 'Vui lòng chọn tên ngân hàng' }]}
          >
            <Select placeholder="Chọn ngân hàng">
              <Option value="Vietcombank">Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</Option>
              <Option value="VietinBank">Ngân hàng TMCP Công thương Việt Nam (VietinBank)</Option>
              <Option value="BIDV">Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)</Option>
              <Option value="Agribank">Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)</Option>
              <Option value="Techcombank">Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)</Option>
              <Option value="ACB">Ngân hàng TMCP Á Châu (ACB)</Option>
              <Option value="VPBank">Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)</Option>
              <Option value="MBBank">Ngân hàng TMCP Quân đội (MBBank)</Option>
              <Option value="Sacombank">Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)</Option>
              <Option value="TPBank">Ngân hàng TMCP Tiên Phong (TPBank)</Option>
              <Option value="HDBank">Ngân hàng TMCP Phát triển TP.HCM (HDBank)</Option>
              <Option value="OCB">Ngân hàng TMCP Phương Đông (OCB)</Option>
              <Option value="SHB">Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)</Option>
              <Option value="SeABank">Ngân hàng TMCP Đông Nam Á (SeABank)</Option>
              <Option value="VIB">Ngân hàng TMCP Quốc tế Việt Nam (VIB)</Option>
              <Option value="MSB">Ngân hàng TMCP Hàng Hải Việt Nam (MSB)</Option>
              <Option value="Eximbank">Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)</Option>
              <Option value="LienVietPostBank">Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)</Option>
              <Option value="Other">Ngân hàng khác</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="account_number"
            label="Số tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
          >
            <Input placeholder="Nhập số tài khoản" />
          </Form.Item>
          
          <Form.Item
            name="account_holder"
            label="Chủ tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
          >
            <Input placeholder="Nhập tên chủ tài khoản" />
          </Form.Item>
          
          <Form.Item
            name="branch"
            label="Chi nhánh"
          >
            <Input placeholder="Nhập chi nhánh (không bắt buộc)" />
          </Form.Item>
          
          <Form.Item
            name="is_default"
            valuePropName="checked"
          >
            <Checkbox>Đặt làm tài khoản mặc định</Checkbox>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="default"
                onClick={() => setAddBankAccountModal(false)}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
              >
                Thêm tài khoản
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionsManager; 