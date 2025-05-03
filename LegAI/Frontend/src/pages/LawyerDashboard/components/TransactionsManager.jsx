import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Typography, Tag, Button, Space, Row, 
  Col, Statistic, DatePicker, Select, Modal, Form, 
  Input, notification, Tooltip, Badge, Tabs, Alert, Divider, Checkbox, Empty, Spin
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  DollarOutlined, BankOutlined, EyeOutlined,
  CalendarOutlined, ExclamationCircleOutlined, PlusOutlined
} from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import legalCaseService from '../../../services/legalCaseService';
import PaymentInfoSetup from './PaymentInfoSetup';
import moment from 'moment';
import styles from './TransactionsManager.module.css';
import { useNavigate } from 'react-router-dom';

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
  const [processingConfirm, setProcessingConfirm] = useState(false);
  const [hasPendingTransactions, setHasPendingTransactions] = useState(false);
  const [hasBankAccounts, setHasBankAccounts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TransactionsManager đã được tải, đang lấy dữ liệu giao dịch...');
    
    // Gọi API để lấy dữ liệu ban đầu
    Promise.all([
      fetchFinancialStats(),
      fetchBankAccounts()
    ]).then(([statsResult, bankAccountsResult]) => {
      // Xác định tab nào cần hiển thị ban đầu
      // Nếu không có tài khoản ngân hàng, ưu tiên hiển thị tab tài khoản
      if (bankAccountsResult && bankAccountsResult.length === 0) {
        setActiveTab('bank-accounts');
        notification.info({
          message: 'Thiết lập tài khoản ngân hàng',
          description: 'Bạn cần thiết lập tài khoản ngân hàng trước để nhận thanh toán từ khách hàng.',
          duration: 5
        });
      }
      // Ngược lại, nếu có giao dịch chờ xác nhận thì hiển thị tab giao dịch
      else if (statsResult && statsResult.stats && statsResult.stats.pending_transactions > 0) {
        setActiveTab('transactions');
        setFilters(prev => ({ ...prev, status: 'pending' }));
        notification.info({
          message: 'Giao dịch chờ xác nhận',
          description: `Bạn có ${statsResult.stats.pending_transactions} giao dịch đang chờ xác nhận thanh toán.`,
          duration: 5
        });
      }
      
      // Đặt lại bộ lọc về mặc định và tải lại dữ liệu giao dịch
      fetchTransactions();
      
      // Thiết lập interval để tự động làm mới dữ liệu sau mỗi 15 giây
      const refreshInterval = setInterval(() => {
        console.log('Tự động làm mới dữ liệu giao dịch...');
        fetchTransactions();
        fetchFinancialStats();
      }, 15000);
      
      // Xóa interval khi component unmount
      return () => clearInterval(refreshInterval);
    });
  }, []);

  // Thêm useEffect để cập nhật khi pagination hoặc filters thay đổi
  useEffect(() => {
    // Chỉ gọi khi component đã mount và có dữ liệu
    if (activeTab === 'transactions') {
      console.log('Cập nhật danh sách giao dịch do thay đổi bộ lọc/phân trang');
      fetchTransactions();
    }
  }, [pagination.current, pagination.pageSize, filters, activeTab]);

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
        
        // Kiểm tra xem có giao dịch đang chờ xác nhận không
        const pendingCount = response.data.stats?.pending_transactions || 0;
        setHasPendingTransactions(pendingCount > 0);
        
        // Tự động chuyển đến tab transactions nếu có giao dịch đang chờ
        if (pendingCount > 0 && activeTab === 'overview') {
          notification.info({
            message: 'Giao dịch chờ xác nhận',
            description: `Bạn có ${pendingCount} giao dịch đang chờ xác nhận thanh toán.`,
            duration: 3
          });
        }
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
      
      console.log('Đang gọi API lấy giao dịch với tham số:', params);
      
      const response = await transactionService.getLawyerTransactions(params);
      
      if (response && response.success) {
        console.log('Kết quả API giao dịch luật sư:', response.data);
        
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
        
        // Hiển thị thông báo nếu không có giao dịch và đang tìm kiếm giao dịch chờ xác nhận
        if (filteredTransactions.length === 0 && filters.status === 'pending') {
          notification.info({
            message: 'Không có giao dịch chờ xác nhận',
            description: 'Hiện tại không có giao dịch nào đang chờ xác nhận. Hệ thống sẽ tự động cập nhật khi có giao dịch mới.',
            duration: 5
          });
        }
      } else {
        console.error('Lỗi API giao dịch luật sư:', response);
        setTransactions([]);
        
        if (response && response.message) {
          notification.warning({
            message: 'Không thể tải giao dịch',
            description: response.message,
            duration: 5
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách giao dịch:', error);
      setTransactions([]);
      
      notification.error({
        message: 'Lỗi kết nối',
        description: 'Không thể kết nối đến máy chủ để lấy danh sách giao dịch. Vui lòng thử làm mới trang.',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const response = await transactionService.getLawyerBankAccounts();
      
      if (response && response.success) {
        const accounts = response.data || [];
        setBankAccounts(accounts);
        
        // Cập nhật state hasBankAccounts
        const hasAccounts = accounts.length > 0;
        setHasBankAccounts(hasAccounts);
        
        // Nếu không có tài khoản ngân hàng và đang ở tab giao dịch, hiển thị thông báo
        if (!hasAccounts && activeTab === 'transactions') {
          notification.info({
            message: 'Thiết lập tài khoản ngân hàng',
            description: 'Bạn chưa thiết lập tài khoản ngân hàng. Vui lòng thiết lập để khách hàng có thể chuyển khoản.',
            duration: 5,
            btn: <Button type="primary" size="small" onClick={() => setActiveTab('bank-accounts')}>
              Thiết lập ngay
            </Button>
          });
        }
        
        return accounts;
      } else {
        setBankAccounts([]);
        setHasBankAccounts(false);
        return [];
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài khoản ngân hàng:', error);
      setBankAccounts([]);
      setHasBankAccounts(false);
      return [];
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
      setProcessingConfirm(true);  // Thêm trạng thái loading
      
      console.log('Bắt đầu xác nhận thanh toán cho giao dịch:', confirmModal.transaction.id);
      console.log('Dữ liệu xác nhận:', values);
      
      // Đảm bảo thông tin case_id có sẵn
      const caseId = confirmModal.transaction.case_id;
      if (!caseId) {
        notification.error({
          message: 'Thiếu thông tin vụ án',
          description: 'Không tìm thấy ID vụ án liên quan đến giao dịch này'
        });
        setProcessingConfirm(false);
        return;
      }
      
      // Thêm case_id vào dữ liệu xác nhận để backend có thể cập nhật trạng thái vụ án
      const confirmData = {
        ...values,
        case_id: caseId,
        update_case_status: true
      };
      
      // Gọi API xác nhận thanh toán với timeout dài hơn (20 giây)
      const response = await transactionService.confirmPaymentByLawyer(
        confirmModal.transaction.id,
        confirmData,
        { timeout: 20000 }
      );
      
      if (response && response.success) {
        notification.success({
          message: 'Xác nhận thanh toán thành công',
          description: 'Giao dịch đã được xác nhận thành công. Trạng thái vụ án đã được cập nhật thành đã thanh toán.'
        });
        
        // Cập nhật thêm trạng thái vụ án
        try {
          if (caseId && values.updateCaseStatus) {
            // Gọi API cập nhật trạng thái vụ án
            await legalCaseService.updateCaseStatus(
              caseId, 
              'paid',  // Trạng thái chính
              `Thanh toán đã được xác nhận vào ${new Date().toLocaleString()}`  // Ghi chú
            );
            
            console.log('Đã cập nhật trạng thái vụ án thành công');
          }
        } catch (caseUpdateError) {
          console.error('Lỗi khi cập nhật trạng thái vụ án:', caseUpdateError);
          // Không hiển thị lỗi cho người dùng vì đã xác nhận thanh toán thành công
        }
        
        // Đóng modal và làm mới dữ liệu
        setConfirmModal({
          visible: false,
          transaction: null
        });
        confirmForm.resetFields();
        
        // Làm mới dữ liệu
        fetchFinancialStats();
        fetchTransactions();
        
        // Cập nhật case_id vào URL nếu có thông tin vụ án
        if (confirmModal.transaction && confirmModal.transaction.case_id) {
          // Chờ 1 giây để hiển thị thông báo thành công trước khi chuyển trang
          setTimeout(() => {
            navigate(`/legal-cases/${confirmModal.transaction.case_id}`);
          }, 1000);
        }
      } else {
        notification.error({
          message: 'Xác nhận thanh toán thất bại',
          description: response?.message || 'Không thể xác nhận thanh toán. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận thanh toán:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi xác nhận thanh toán.';
      
      // Xử lý các trường hợp lỗi cụ thể
      if (error.response && error.response.status === 404) {
        errorMessage = 'Không tìm thấy giao dịch hoặc vụ án tương ứng.';
      } else if (error.response && error.response.status === 403) {
        errorMessage = 'Bạn không có quyền xác nhận thanh toán cho giao dịch này.';
      } else if (error.response && error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ.';
      } else if (error.request && !error.response) {
        errorMessage = 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }
      
      notification.error({
        message: 'Xác nhận thanh toán thất bại',
        description: errorMessage
      });
    } finally {
      setProcessingConfirm(false);  // Kết thúc trạng thái loading
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
        return <Tag color="orange">Đang chờ xác nhận</Tag>;
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
            <Tooltip title="Xác nhận đã nhận thanh toán">
              <Button 
                type="primary" 
                shape="circle" 
                icon={<CheckCircleOutlined />} 
                size="small"
                onClick={() => handleConfirmPayment(record)}
                className={styles.confirmButton}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Xử lý khi tab thay đổi
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // Nếu chuyển sang tab 'transactions', tải lại dữ liệu giao dịch
    if (key === 'transactions') {
      fetchTransactions();
    }
    
    // Nếu chuyển sang tab 'bank-accounts', tải lại dữ liệu tài khoản ngân hàng
    if (key === 'bank-accounts') {
      fetchBankAccounts();
    }
  };

  const renderBankAccountsTab = () => {
    if (loadingBankAccounts) {
      return (
        <div className={styles.loadingState}>
          <Spin tip="Đang tải dữ liệu tài khoản ngân hàng..." />
        </div>
      );
    }

    if (bankAccounts.length === 0) {
      return (
        <PaymentInfoSetup onComplete={() => {
          fetchBankAccounts().then(() => {
            notification.success({
              message: 'Thiết lập thành công',
              description: 'Tài khoản ngân hàng đã được thiết lập. Bạn có thể xác nhận thanh toán ngay bây giờ.',
              duration: 5
            });
            setActiveTab('transactions');
          });
        }} />
      );
    }

    return (
      <div className={styles.bankAccountsSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text>
                Bạn đã thiết lập {bankAccounts.length} tài khoản ngân hàng để nhận thanh toán.
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddBankAccountModal}
              >
                Thêm tài khoản ngân hàng
              </Button>
            </div>
          </Col>
          
          {bankAccounts.map(account => (
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
          ))}
        </Row>
      </div>
    );
  };

  const renderTransactionsTab = () => {
    // Nếu không có tài khoản ngân hàng, hiển thị giao diện thiết lập
    if (!hasBankAccounts) {
      return (
        <PaymentInfoSetup onComplete={() => {
          fetchBankAccounts().then(() => {
            notification.success({
              message: 'Thiết lập thành công',
              description: 'Tài khoản ngân hàng đã được thiết lập. Bạn có thể xác nhận thanh toán ngay bây giờ.',
              duration: 5
            });
            fetchTransactions();
          });
        }} />
      );
    }

    return (
      <>
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
        
        {!loading && transactions.length === 0 && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <Empty 
              description={
                <span>
                  Không tìm thấy giao dịch nào
                  <br />
                  <Button 
                    type="link" 
                    onClick={handleRefresh}
                    style={{ padding: 0 }}
                  >
                    Bấm vào đây để tải lại
                  </Button>
                </span>
              } 
            />
          </div>
        )}
        
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
      </>
    );
  };

  return (
    <div className={styles.transactionsManager}>
      <div className={styles.header}>
        <Title level={4}>Quản lý thanh toán</Title>
        <Space>
          {hasPendingTransactions && (
            <Badge count={stats.pending_transactions || 0} offset={[-5, 5]}>
              <Button 
                type="primary" 
                onClick={() => {
                  setActiveTab('transactions');
                  setFilters({...filters, status: 'pending'});
                  setPagination({...pagination, current: 1});
                  fetchTransactions();
                }}
                style={{ marginRight: 8 }}
              >
                Xác nhận thanh toán
              </Button>
            </Badge>
          )}
          <Button type="primary" onClick={handleRefresh}>
            Làm mới
          </Button>
        </Space>
      </div>
      
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
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
          {renderTransactionsTab()}
        </TabPane>
        
        <TabPane tab="Tài khoản ngân hàng" key="bank-accounts">
          {renderBankAccountsTab()}
        </TabPane>
      </Tabs>
      
      {/* Modal xác nhận thanh toán */}
      <Modal
        title="Xác nhận đã nhận thanh toán"
        open={confirmModal.visible}
        onCancel={() => setConfirmModal({ visible: false, transaction: null })}
        footer={null}
        width={600}
      >
        {confirmModal.transaction && (
          <Form
            form={confirmForm}
            layout="vertical"
            onFinish={submitConfirmPayment}
          >
            <Alert
              message="Xác nhận đã nhận được thanh toán"
              description="Bằng cách xác nhận, bạn xác nhận đã kiểm tra và nhận được khoản thanh toán trong tài khoản ngân hàng của mình. Trạng thái vụ án sẽ được cập nhật tương ứng."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Paragraph>
              <Text strong>Vụ án:</Text> {confirmModal.transaction.case_title}
            </Paragraph>
            <Paragraph>
              <Text strong>Khách hàng:</Text> {confirmModal.transaction.user_name}
            </Paragraph>
            <Paragraph>
              <Text strong>Số tiền:</Text> {formatCurrency(confirmModal.transaction.amount)}
            </Paragraph>
            <Paragraph>
              <Text strong>Phương thức thanh toán:</Text> {formatPaymentMethod(confirmModal.transaction.payment_method || 'bank_transfer')}
            </Paragraph>
            
            {confirmModal.transaction.notes && (
              <Paragraph>
                <Text strong>Ghi chú của khách hàng:</Text> {confirmModal.transaction.notes}
              </Paragraph>
            )}
            
            <Divider />
            
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
                  disabled={processingConfirm}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  loading={processingConfirm}
                  disabled={processingConfirm}
                >
                  Xác nhận đã nhận thanh toán
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