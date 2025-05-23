import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Badge, Typography, Card, Row, Col, Space, Dropdown, Statistic, List, Divider, Tag, Popover } from 'antd';
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
import legalCaseService from '../../services/legalCaseService';
import legalService from '../../services/legalService.jsx';
import { getLawyerTransactions } from '../../services/transactionService';
import AppointmentsManager from './components/AppointmentsManager';
import AvailabilityManager from './components/AvailabilityManager';
import ChatManager from './components/ChatManager';
import { default as LawyerCaseManager } from './LawyerCaseManager.jsx';
import TransactionsManager from './components/TransactionsManager';
import ContactForm from '../Contact/ContactForm';
import PaymentInfoSetup from './components/PaymentInfoSetup';
import ClientsManager from './components/ClientsManager';
import LawyerSpecialtyEditor from './components/LawyerSpecialtyEditor';

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
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    casesProcessed: 0,
    appointmentsCompleted: 0,
    documentsReviewed: 0,
    newClients: 0
  });
  const [notificationVisible, setNotificationVisible] = useState(false);

  const navigate = useNavigate();

  const fetchCasesCount = async () => {
    try {
      const response = await legalCaseService.getLawyerCases({ limit: 1 });
      if (response.success) {
        setCaseCount(response.count || 0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy số lượng vụ án:', error);
      setCaseCount(0);
    }
  };

  const fetchDocumentsCount = async () => {
    try {
      const response = await legalService.getLegalDocumentStats();
      if (response && response.status === 'success') {
        setDocumentCount(response.data.pendingReview || 0);
      } else {
        setDocumentCount(0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy số lượng tài liệu:', error);
      setDocumentCount(0);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activitiesResponse = await userService.getRecentActivities();
      if (activitiesResponse && activitiesResponse.success) {
        setNotifications(activitiesResponse.data.map(activity => ({
          id: activity.id,
          message: activity.message,
          time: activity.timeAgo,
          icon: activity.icon || 'calendar-check'
        })));
      } else {
        setNotifications([
          { id: 1, message: 'Bạn có lịch hẹn mới', time: '10 phút trước', icon: 'calendar-check' },
          { id: 3, message: 'Tin nhắn mới từ khách hàng', time: '2 giờ trước', icon: 'message' },
          { id: 4, message: 'Nhắc nhở: Phiên tòa ngày mai', time: '5 giờ trước', icon: 'gavel' },
        ]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy hoạt động gần đây:', error);
      setNotifications([
        { id: 1, message: 'Bạn có lịch hẹn mới', time: '10 phút trước', icon: 'calendar-check' },
        { id: 3, message: 'Tin nhắn mới từ khách hàng', time: '2 giờ trước', icon: 'message' },
        { id: 4, message: 'Nhắc nhở: Phiên tòa ngày mai', time: '5 giờ trước', icon: 'gavel' },
      ]);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await appointmentService.getUpcomingAppointments();
      if (response && response.success) {
        setRecentAppointments(response.data.map(apt => {
          const dateText = apt.isToday ? 'Hôm nay' : apt.isTomorrow ? 'Ngày mai' : apt.date;
          return `${apt.title || 'Lịch hẹn với ' + apt.clientName} - ${apt.time}, ${dateText}`;
        }));
      } else {
        setRecentAppointments(['Không có lịch hẹn sắp tới']);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch hẹn sắp tới:', error);
      setRecentAppointments(['Đang tải lịch hẹn...']);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const caseStatsResponse = await legalCaseService.getLawyerCaseStats();
      const appointmentStatsResponse = await appointmentService.getMonthlyAppointmentStats();
      const documentStatsResponse = await legalService.getDocumentStats();
      const clientStatsResponse = await userService.getClientStats();
      
      setMonthlyStats({
        casesProcessed: caseStatsResponse?.data?.completedThisMonth || 0,
        appointmentsCompleted: appointmentStatsResponse?.data?.completedThisMonth || 0,
        documentsReviewed: documentStatsResponse?.data?.reviewedThisMonth || 0,
        newClients: clientStatsResponse?.data?.newClientsThisMonth || 0
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tháng:', error);
      setMonthlyStats({
        casesProcessed: 0,
        appointmentsCompleted: 0,
        documentsReviewed: 0,
        newClients: 0
      });
    }
  };

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
          } else {
            setAppointmentCount(0);
          }
          
          const unreadCount = await chatService.countUnreadMessages();
          setUnreadMessages(unreadCount);
          setPendingCount(unreadCount);
          
          await fetchCasesCount();
          await fetchDocumentsCount();
          
          await fetchRecentActivities();
          await fetchUpcomingAppointments();
          await fetchMonthlyStats();
          
        } catch (error) {
          console.error('Lỗi khi lấy thống kê:', error);
          setPendingCount(0);
          setAppointmentCount(0);
        }
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
              <Statistic value={item.stat} suffix={item.desc} />
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
            style={{ 
              animationDelay: `${index * 0.1}s`,
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: '12px',
              borderRadius: '4px'
            }}
            onClick={() => handleNotificationItemClick(notification)}
            onMouseEnter={e => {e.currentTarget.style.backgroundColor = '#f0f5ff'}}
            onMouseLeave={e => {e.currentTarget.style.backgroundColor = 'transparent'}}
          >
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: '#4a6cf7' }} icon={
                notification.icon === 'calendar-check' ? <CalendarOutlined /> :
                notification.icon === 'file-check' ? <FileTextOutlined /> : 
                notification.icon === 'message' ? <MessageOutlined /> : <AuditOutlined />
              } />}
              title={<span style={{ color: '#1a1a1a' }}>{notification.message}</span>}
              description={<span style={{ color: '#666' }}>{notification.time}</span>}
            />
            <RightOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
          </List.Item>
        )}
      />
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
      <TransactionsManager />
    </div>
  );
  
  const renderClients = () => (
    <div className="animate__animated animate__fadeIn">
      <ClientsManager />
    </div>
  );
  
  const renderSpecialties = () => (
    <div className="animate__animated animate__fadeIn">
      <LawyerSpecialtyEditor />
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
      case 'clients':
        return renderClients();
      case 'specialties':
        return renderSpecialties();
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

  const handleNotificationItemClick = (notification) => {
    setNotificationVisible(false);
    
    if (notification.icon === 'calendar-check') {
      setActiveMenu('appointments');
    } else if (notification.icon === 'file-check') {
      setActiveMenu('documents');
    } else if (notification.icon === 'message') {
      setActiveMenu('messages');
    } else if (notification.icon === 'gavel') {
      setActiveMenu('cases');
    }
  };

  const notificationsContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Thông Báo</Text>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item 
            style={{ 
              padding: '10px 16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onClick={() => handleNotificationItemClick(notification)}
            onMouseEnter={e => {e.currentTarget.style.backgroundColor = '#f0f5ff'}}
            onMouseLeave={e => {e.currentTarget.style.backgroundColor = 'transparent'}}
          >
            <List.Item.Meta
              avatar={
                <Avatar style={{ backgroundColor: '#4a6cf7' }} icon={
                  notification.icon === 'calendar-check' ? <CalendarOutlined /> :
                  notification.icon === 'file-check' ? <FileTextOutlined /> : 
                  notification.icon === 'message' ? <MessageOutlined /> : <AuditOutlined />
                } />
              }
              title={notification.message}
              description={notification.time}
            />
          </List.Item>
        )}
      />
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link">Xem tất cả</Button>
      </div>
    </div>
  );

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
            <Popover 
              content={notificationsContent} 
              trigger="click"
              visible={notificationVisible}
              onVisibleChange={setNotificationVisible}
              placement="bottomRight"
              overlayStyle={{ width: 350 }}
              overlayInnerStyle={{ padding: 0 }}
            >
              <Badge count={notifications.length}>
                <Avatar 
                  icon={<BellOutlined />} 
                  style={{ backgroundColor: '#4a6cf7', cursor: 'pointer' }} 
                />
              </Badge>
            </Popover>
            
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