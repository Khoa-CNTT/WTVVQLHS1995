import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Badge, Typography, Card, Row, Col, Space, Dropdown, Statistic, List, Divider, Tag } from 'antd';
import { 
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, BellOutlined, LogoutOutlined,
  MessageOutlined, FileTextOutlined, CalendarOutlined, ScheduleOutlined, 
  TeamOutlined, PhoneOutlined, DollarOutlined, AuditOutlined,
  FileProtectOutlined, RightOutlined, SafetyOutlined, BookOutlined
} from '@ant-design/icons';
import 'animate.css';
import authService from '../../services/authService';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import chatService from '../../services/chatService';
import AppointmentsManager from './components/AppointmentsManager';
import AvailabilityManager from './components/AvailabilityManager';
import ChatManager from './components/ChatManager';
import { default as LawyerCaseManager } from './LawyerCaseManager.jsx';
import TransactionsManager from './components/TransactionsManager';
import ContactForm from '../Contact/ContactForm';
import PaymentInfoSetup from './components/PaymentInfoSetup';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const LawyerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        let user = await userService.refreshUserData();
        if (!user) {
          user = authService.getCurrentUser();
        }
        if (!user || (user.role?.toLowerCase() !== 'lawyer' && user.role?.toLowerCase() !== 'admin')) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);

        try {
          const appointmentStatsResponse = await appointmentService.getAppointmentStats();
          if (appointmentStatsResponse.status === 'success') {
            setAppointmentCount(appointmentStatsResponse.data.pending || 0);
          }
          const unreadCount = await chatService.countUnreadMessages();
          setUnreadMessages(unreadCount);
          setPendingCount(unreadCount);
          setCaseCount(24);
          setDocumentCount(35);
        } catch (error) {
          console.error('Lỗi khi lấy thống kê:', error);
          setPendingCount(0);
          setAppointmentCount(0);
          setCaseCount(24);
          setDocumentCount(35);
        }

        setNotifications([
          { id: 1, message: 'Bạn có lịch hẹn mới', time: '10 phút trước', icon: 'calendar-check' },
          { id: 2, message: 'Tài liệu đã được duyệt', time: '35 phút trước', icon: 'file-check' },
          { id: 3, message: 'Tin nhắn mới từ khách hàng', time: '2 giờ trước', icon: 'message' },
          { id: 4, message: 'Nhắc nhở: Phiên tòa ngày mai', time: '5 giờ trước', icon: 'gavel' },
        ]);
      } catch (error) {
        console.error('Error checking user:', error);
        navigate('/login');
      }
    };

    checkUser();

    const interval = setInterval(async () => {
      try {
        const unreadCount = await chatService.countUnreadMessages();
        setUnreadMessages(unreadCount);
        setPendingCount(unreadCount);
      } catch (error) {
        console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const navigateToHome = () => navigate('/');
  const navigateToProfile = () => {
    navigate('/profile');
    setUserProfileOpen(false);
  };
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const toggleUserMenu = () => setUserProfileOpen(!userProfileOpen);

  const menuItems = [
    { key: 'overview', label: 'Tổng Quan', icon: <AuditOutlined />, count: 0 },
    { key: 'messages', label: 'Tin Nhắn', icon: <MessageOutlined />, count: pendingCount },
    { key: 'cases', label: 'Vụ Án', icon: <SafetyOutlined />, count: 0 },
    { key: 'appointments', label: 'Lịch Hẹn', icon: <CalendarOutlined />, count: appointmentCount },
    { key: 'availability', label: 'Quản Lý Lịch Trống', icon: <ScheduleOutlined />, count: 0 },
    { key: 'clients', label: 'Khách Hàng', icon: <TeamOutlined />, count: 0 },
    { key: 'contact', label: 'Liên Hệ', icon: <PhoneOutlined />, count: 0 },
    { key: 'transactions', label: 'Giao Dịch', icon: <DollarOutlined />, count: 0 },
    { key: 'specialties', label: 'Chuyên Môn', icon: <BookOutlined />, count: 0 },
  ];

  const renderOverview = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Tổng Quan Luật Sư</Title>
      <Paragraph 
        style={{ 
          fontSize: '16px', 
          fontStyle: 'italic', 
          borderLeft: '4px solid #1890ff', 
          paddingLeft: 20, 
          margin: '20px 0',
          backgroundColor: '#f0f5ff',
          padding: '15px'
        }}
      >
        "Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy đang được thực thi."
      </Paragraph>

      <Row gutter={[16, 16]}>
        {[
          { icon: <MessageOutlined />, title: 'Tin Nhắn Chưa Đọc', stat: pendingCount, desc: 'tin nhắn', menu: 'messages' },
          { icon: <CalendarOutlined />, title: 'Lịch Hẹn Sắp Tới', stat: appointmentCount, desc: 'cuộc hẹn', menu: 'appointments' },
          { icon: <SafetyOutlined />, title: 'Vụ Án Đang Xử Lý', stat: caseCount, desc: 'vụ án', menu: 'cases' },
          { icon: <FileTextOutlined />, title: 'Tài Liệu Cần Xem Xét', stat: documentCount, desc: 'tài liệu', menu: 'documents' },
        ].map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              hoverable 
              style={{ height: '100%' }}
              styles={{ header: { borderBottom: 0 } }}
              title={
                <Space>
                  {item.icon}
                  <span>{item.title}</span>
                </Space>
              }
            >
              <Button 
                type="primary" 
                style={{ marginTop: 16 }} 
                onClick={() => setActiveMenu(item.menu)}
              >
                Xem Chi Tiết <RightOutlined />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <Title level={4}>Hoạt Động Gần Đây</Title>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(notification, index) => (
          <List.Item 
            className={`animate__animated animate__slideInUp`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <List.Item.Meta
              avatar={<Avatar icon={
                notification.icon === 'calendar-check' ? <CalendarOutlined /> :
                notification.icon === 'file-check' ? <FileTextOutlined /> : 
                notification.icon === 'message' ? <MessageOutlined /> : <AuditOutlined />
              } />}
              title={notification.message}
              description={notification.time}
            />
          </List.Item>
        )}
      />

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Lịch Hẹn Sắp Tới">
            <List
              dataSource={[
                'Gặp khách hàng Nguyễn Văn A - 9:00 AM, Hôm nay',
                'Tư vấn luật doanh nghiệp - 11:30 AM, Hôm nay',
                'Hòa giải vụ kiện lao động - 14:00, Hôm nay',
                'Thảo luận hợp đồng với Công ty X - 9:30 AM, Ngày mai'
              ]}
              renderItem={item => {
                const parts = item.split(' - ');
                return (
                  <List.Item>
                    <Text>{parts[0]} - <Text strong>{parts[1]}</Text></Text>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Thống Kê Tháng Này">
            <List
              dataSource={[
                'Vụ án đã xử lý: 8',
                'Lịch hẹn đã hoàn thành: 24',
                'Tài liệu đã duyệt: 35',
                'Khách hàng mới: 12'
              ]}
              renderItem={item => {
                const parts = item.split(': ');
                return (
                  <List.Item>
                    <Text>{parts[0]}: <Text strong>{parts[1]}</Text></Text>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderMessages = () => (
    <div className="animate__animated animate__fadeIn">
      <ChatManager />
    </div>
  );

  const renderCases = () => (
    <div className="animate__animated animate__fadeIn">
      <LawyerCaseManager />
    </div>
  );

  const renderAppointments = () => (
    <div className="animate__animated animate__fadeIn">
      <AppointmentsManager />
    </div>
  );

  const renderAvailability = () => (
    <div className="animate__animated animate__fadeIn">
      <AvailabilityManager />
    </div>
  );

  const renderDocuments = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Tài Liệu</Title>
      <Paragraph>
        Quản lý và xem xét các tài liệu pháp lý, hợp đồng và hồ sơ vụ án.
      </Paragraph>
      <Card style={{ textAlign: 'center', padding: '30px' }}>
        <Text italic style={{ fontSize: '18px' }}>
          Tính năng này đang được phát triển. Sẽ sớm ra mắt!
        </Text>
      </Card>
    </div>
  );

  const renderContact = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Liên Hệ</Title>
      <Paragraph>
        Gửi thông tin liên hệ đến bộ phận hỗ trợ của LegAI.
      </Paragraph>
      <ContactForm />
    </div>
  );

  const renderTransactions = () => (
    <div className="animate__animated animate__fadeIn">
      {currentUser.payment_setup_complete ? (
        <TransactionsManager />
      ) : (
        <PaymentInfoSetup onComplete={() => {
          // Refresh user data sau khi hoàn thành thiết lập
          userService.refreshUserData().then(userData => {
            setCurrentUser(userData);
          });
        }} />
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return renderOverview();
      case 'messages':
        return renderMessages();
      case 'cases':
        return renderCases();
      case 'appointments':
        return renderAppointments();
      case 'availability':
        return renderAvailability();
      case 'documents':
        return renderDocuments();
      case 'contact':
        return renderContact();
      case 'transactions':
        return renderTransactions();
      default:
        return renderOverview();
    }
  };

  const getCurrentDate = () =>
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userMenuItems = [
    {
      key: '1',
      label: 'Hồ Sơ Của Tôi',
      icon: <UserOutlined />,
      onClick: navigateToProfile,
    },
    {
      key: '2',
      label: 'Đăng Xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={260}
        style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div 
          style={{ 
            height: '64px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontSize: collapsed ? '24px' : '26px',
            fontWeight: 'bold',
            color: '#4a6cf7',
            cursor: 'pointer'
          }}
          onClick={navigateToHome}
        >
          {collapsed ? 'L' : 'LegAI'}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeMenu]}
          onClick={e => setActiveMenu(e.key)}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: (
              <span>
                {item.label}
                {item.count > 0 && (
                  <Badge count={item.count} style={{ marginLeft: 10 }} />
                )}
              </span>
            )
          }))}
        />
        
        <div 
          style={{ 
            padding: '16px',
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #f0f0f0' 
          }}
        >
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            {!collapsed && 'Đăng Xuất'}
          </Button>
        </div>
      </Sider>
      
      <Layout>
        <Header 
          style={{ 
            background: '#fff', 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Title level={4} style={{ margin: 0 }}>
                {activeMenu === 'overview'
                  ? 'Bảng Điều Khiển Luật Sư'
                  : menuItems.find((item) => item.key === activeMenu)?.label || 'Bảng Điều Khiển'}
              </Title>
              <Text type="secondary">{getCurrentDate()}</Text>
            </div>
          </div>
          
          <Space>
            <Badge count={notifications.length}>
              <Avatar 
                icon={<BellOutlined />} 
                style={{ backgroundColor: '#4a6cf7', cursor: 'pointer' }} 
              />
            </Badge>
            
            {currentUser.fullName && (
              <Text strong style={{ margin: '0 16px' }}>
                {currentUser.fullName}
              </Text>
            )}
            
            <Dropdown 
              menu={{ items: userMenuItems }} 
              trigger={['click']}
              placement="bottomRight"
              arrow
            >
              <Avatar 
                style={{ 
                  backgroundColor: '#4a6cf7', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                size="large"
              >
                {getInitials(currentUser.fullName)}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <div 
            style={{ 
              padding: '24px', 
              background: '#fff', 
              borderRadius: '4px',
              minHeight: '100%'
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LawyerDashboard;