import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Badge, Space, Card, Divider, Row, Col, Statistic, Empty, Spin } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  HomeOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  FolderOutlined, 
  BankOutlined, 
  FileProtectOutlined, 
  RobotOutlined, 
  MessageOutlined, 
  DollarOutlined, 
  LogoutOutlined,
  BellOutlined,
  UserOutlined
} from '@ant-design/icons';
import styles from './DashboardPage.module.css';
import UsersManagerPage from './UsersManager/UsersManager';
import authService from '../../services/authService';
import 'animate.css';
import LegalDocumentsManager from './LegalDocuments/LegalDocumentsManager';
import DocumentTemplatesManager from './DocumentTemplates/DocumentTemplatesManager';
import UserMenuPortal from './components/UserMenuPortal';
import scraperService from '../../services/scraperService';
import { toast } from 'react-toastify';
import UpdateNotification from '../../components/Dashboard/UpdateNotification';
import UserLegalDocsManager from './UserLegalDocs/UserLegalDocsManager';
import NotificationMenuPortal from './components/NotificationMenuPortal';
import ChatManager from '../LawyerDashboard/components/ChatManager';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Dashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('tổng-quan');
  const [statCounts, setStatCounts] = useState({
    documents: 0,
    cases: 0,
    appointments: 0,
    contracts: 0
  });
  const [notifications, setNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuTimeoutRef = useRef(null);
  const userAvatarRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, right: 0 });
  const notificationIconRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    const targetCounts = { documents: 15, cases: 5, appointments: 3, contracts: 2 };
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);

    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      setStatCounts(Object.fromEntries(
        Object.keys(targetCounts).map(key => [key, Math.floor(progress * targetCounts[key])])
      ));
      if (frame === totalFrames) {
        setStatCounts(targetCounts);
        clearInterval(timer);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    if (userMenuOpen && userAvatarRef.current) {
      const rect = userAvatarRef.current.getBoundingClientRect();
      
      // Khoảng cách từ avatar đến menu
      const verticalGap = 10;
      
      setDropdownPosition({
        top: rect.bottom + verticalGap,
        right: window.innerWidth - rect.right + (rect.width / 2 - 110) // Căn chỉnh để mũi tên trỏ đến avatar
      });
    }
  }, [userMenuOpen]);

  useEffect(() => {
    // Kiểm tra kết nối API
    const checkApiConnection = async () => {
      const isConnected = await scraperService.testApiConnection();
      if (!isConnected) {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      } else {
        fetchNotifications();
        
        // Cập nhật thông báo mỗi 2 phút
        const interval = setInterval(() => {
          fetchNotifications();
        }, 2 * 60 * 1000);
        
        return () => clearInterval(interval);
      }
    };
    
    checkApiConnection();
  }, []);

  useEffect(() => {
    // Kiểm tra nếu đang ở route chi tiết hồ sơ
    if (location.pathname.includes('/dashboard/legal-docs/')) {
      setActiveMenu('hồ-sơ-người-dùng');
    }
  }, [location.pathname]);

  // Cập nhật vị trí của dropdown thông báo dựa vào vị trí của icon
  useEffect(() => {
    if (showNotifications && notificationIconRef.current) {
      const rect = notificationIconRef.current.getBoundingClientRect();
      setNotificationPosition({
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right
      });
    }
  }, [showNotifications]);

  const goToHomePage = () => navigate('/');
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  const toggleCollapsed = () => setCollapsed(!collapsed);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const goToProfilePage = () => navigate('/profile');

  const handleScrapeLegalDocuments = async () => {
    try {
      toast.info('Đang cập nhật dữ liệu văn bản pháp luật, vui lòng đợi...');
      const result = await scraperService.scrapeLegalDocuments(20, true);
      if (result && result.status === 'success') {
        toast.success(`Đã cập nhật thành công ${result.count || 0} văn bản pháp luật`);
      } else {
        toast.warning('Cập nhật dữ liệu chạy trong nền, kết quả sẽ được cập nhật sau.');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật dữ liệu văn bản pháp luật:', error);
      toast.error('Không thể cập nhật dữ liệu văn bản pháp luật. Vui lòng thử lại sau.');
    }
  };

  const handleScrapeContracts = async () => {
    try {
      toast.info('Đang cập nhật dữ liệu hợp đồng, vui lòng đợi...');
      const result = await scraperService.scrapeContracts(20, true);
      if (result && result.status === 'success') {
        toast.success(`Đã cập nhật thành công ${result.count || 0} hợp đồng`);
      } else {
        toast.warning('Cập nhật dữ liệu chạy trong nền, kết quả sẽ được cập nhật sau.');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật dữ liệu hợp đồng:', error);
      toast.error('Không thể cập nhật dữ liệu hợp đồng. Vui lòng thử lại sau.');
    }
  };

  const handleUserMenuMouseEnter = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
      userMenuTimeoutRef.current = null;
    }
  };

  const handleUserMenuMouseLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 500);
  };

  const menuItems = [
    { key: 'tổng-quan', label: 'Tổng Quan', icon: <HomeOutlined />, title: 'Tổng quan hệ thống' },
    { key: 'người-dùng', label: 'Tài Khoản', icon: <TeamOutlined />, title: 'Quản lý tài khoản người dùng' },
    { key: 'tài-liệu-pháp-lý', label: 'Tài Liệu pháp luật', icon: <FileTextOutlined />, title: 'Quản lý tài liệu pháp luật' },
    { key: 'hồ-sơ-người-dùng', label: 'Hồ sơ pháp lý', icon: <FolderOutlined />, title: 'Quản lý hồ sơ pháp lý' },
    { key: 'vụ-án', label: 'Mẫu văn bản', icon: <BankOutlined />, title: 'Mẫu văn bản pháp luật' },
    { key: 'hợp-đồng', label: 'Hợp Đồng', icon: <FileProtectOutlined />, title: 'Quản lý hợp đồng' },
    { key: 'tư-vấn-ai', label: 'Tư Vấn AI', icon: <RobotOutlined />, title: 'Hệ thống tư vấn AI' },
    { key: 'tin-nhắn', label: 'Tin Nhắn', icon: <MessageOutlined />, title: 'Hệ thống tin nhắn' },
    { key: 'giao-dịch', label: 'Giao Dịch', icon: <DollarOutlined />, title: 'Quản lý giao dịch' }
  ];

  const userMenuItems = [
    { icon: '🏠', label: 'Trang chủ', onClick: () => navigate('/') },
    { icon: '👤', label: 'Hồ sơ', onClick: goToProfilePage },
    { icon: '🚪', label: 'Đăng xuất', onClick: handleLogout }
  ];

  const renderDashboardOverview = () => (
    <div className="animate__animated animate__fadeIn">
      <UpdateNotification />
      <Title level={3}>Tổng Quan Hoạt Động</Title>
      <Card style={{ marginBottom: 16, textAlign: 'center', fontStyle: 'italic' }}>
        <Paragraph>"Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy là đang được thực thi"</Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic 
              title="Văn bản pháp lý" 
              value={statCounts.documents} 
              suffix="tài liệu"
              valueStyle={{ color: '#3f8600' }} 
            />
            <Divider />
            <Button 
              type="primary" 
              onClick={handleScrapeLegalDocuments}
              block
            >
              Cập nhật dữ liệu
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic 
              title="Vụ án" 
              value={statCounts.cases} 
              suffix="vụ án" 
              valueStyle={{ color: '#cf1322' }}
            />
            <Divider />
            <Button type="default" block disabled>
              Xem chi tiết
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic 
              title="Lịch hẹn" 
              value={statCounts.appointments} 
              suffix="cuộc hẹn"
              valueStyle={{ color: '#1890ff' }}
            />
            <Divider />
            <Button type="default" block disabled>
              Quản lý lịch hẹn
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic 
              title="Hợp đồng" 
              value={statCounts.contracts} 
              suffix="bản"
              valueStyle={{ color: '#722ed1' }}
            />
            <Divider />
            <Button 
              type="primary" 
              onClick={handleScrapeContracts}
              block
            >
              Cập nhật dữ liệu
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderUserProfile = () => (
    <div className="animate__animated animate__fadeIn">
      <UsersManagerPage />
    </div>
  );

  const renderLegalDocuments = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Quản lý tài liệu pháp luật</Title>
      <LegalDocumentsManager />
    </div>
  );

  const renderDocumentTemplates = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Quản lý mẫu văn bản</Title>
      <DocumentTemplatesManager />
    </div>
  );

  const renderUserLegalDocs = () => (
    <div className="animate__animated animate__fadeIn">
      <Title level={3}>Quản lý hồ sơ pháp lý của người dùng</Title>
      <UserLegalDocsManager />
    </div>
  );

  const renderContent = () => {
    const sections = {
      'tổng-quan': renderDashboardOverview(),
      'người-dùng': renderUserProfile(),
      'tài-liệu-pháp-lý': renderLegalDocuments(),
      'vụ-án': renderDocumentTemplates(),
      'hồ-sơ-người-dùng': renderUserLegalDocs(),
      'hợp-đồng': (
        <div className="animate__animated animate__fadeIn">
          <Title level={3}>Quản Lý Hợp Đồng</Title>
          <Card>
            <Empty description="Tính năng đang được phát triển" />
          </Card>
        </div>
      ),
      'tư-vấn-ai': <Title level={3}>Tư Vấn AI</Title>,
      'tin-nhắn': <ChatManager />,
      'giao-dịch': <Title level={3}>Giao Dịch</Title>
    };
    return sections[activeMenu] || <Card>Chọn một mục từ menu</Card>;
  };

  const getCurrentDate = () => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getUserInitials = () => {
    if (currentUser?.fullName) {
      const nameParts = currentUser.fullName.split(' ');
      return nameParts.length > 1
        ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
        : currentUser.fullName.charAt(0).toUpperCase();
    }
    return currentUser?.username?.substring(0, 2).toUpperCase() || 'ND';
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await scraperService.getAutoUpdateNotifications();
      
      
      if (response && response.success && Array.isArray(response.data)) {
        setNotificationItems(response.data);
        setNotifications(response.data.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Trường hợp API trả về response.data trực tiếp
        setNotificationItems(response.data);
        setNotifications(response.data.length);
      } else {
        console.warn('Định dạng phản hồi không đúng:', response);
        setNotificationItems([]);
        setNotifications(0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      setNotificationItems([]);
      setNotifications(0);
    } finally {
      setNotificationsLoading(false);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      const response = await scraperService.markNotificationAsShown(id);
      
      if (response.success) {
        // Cập nhật lại danh sách thông báo
        const updatedNotifications = notificationItems.filter(item => item.id !== id);
        setNotificationItems(updatedNotifications);
        setNotifications(updatedNotifications.length);
        toast.success('Đã đánh dấu thông báo là đã đọc');
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      toast.error('Không thể đánh dấu thông báo. Vui lòng thử lại sau.');
    }
  };
  
  const formatDateTime = (dateTimeString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('vi-VN', options);
  };
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={280}
        style={{
          background: 'linear-gradient(180deg, #1e3a8a, #3b82f6)',
          overflowY: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          zIndex: 1000
        }}
      >
        <div 
          style={{ 
            padding: '20px 0', 
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            cursor: 'pointer'
          }}
          onClick={goToHomePage}
        >
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              color: 'white',
              background: 'linear-gradient(45deg, #fff, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            LegAI
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={e => setActiveMenu(e.key)}
          style={{ background: 'transparent', borderRight: 0 }}
        />
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            padding: '16px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Button 
            type="default" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            block
            danger
            style={{ background: 'transparent', borderColor: '#ffd700', color: 'white' }}
          >
            {!collapsed && 'Đăng xuất'}
          </Button>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'margin-left 0.3s' }}>
        <Button
          type="primary"
          onClick={toggleCollapsed}
          style={{
            position: 'fixed',
            top: 20,
            left: collapsed ? 80 : 280,
            transform: 'translateX(-50%)',
            zIndex: 1001,
            width: 32,
            height: 32,
            padding: 0,
            borderRadius: '50%'
          }}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        />
        <Header 
          style={{ 
            background: 'white', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Title level={4} style={{ margin: 0,padding: 0 }}>HỆ THỐNG QUẢN LÝ PHÁP LÝ</Title>
            <Text type="secondary">{getCurrentDate()}</Text>
          </div>
          <Space size="middle">
            <Badge count={notifications}>
              <Avatar
                ref={notificationIconRef}
                icon={<BellOutlined />}
                style={{ cursor: 'pointer', background: '#1890ff' }}
                onClick={toggleNotifications}
              />
            </Badge>
            <Text>{currentUser?.fullName || currentUser?.username || 'NGƯỜI DÙNG'}</Text>
            <Avatar 
              ref={userAvatarRef}
              style={{ 
                backgroundColor: '#f56a00', 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onMouseEnter={handleUserMenuMouseEnter}
              onMouseLeave={handleUserMenuMouseLeave}
            >
              {getUserInitials()}
            </Avatar>
          </Space>
          
          <NotificationMenuPortal
            isOpen={showNotifications}
            position={notificationPosition}
            onClose={() => setShowNotifications(false)}
            notifications={notificationItems}
            loading={notificationsLoading}
            onMarkAsRead={handleMarkAsRead}
            formatDateTime={formatDateTime}
          />
          
          <UserMenuPortal 
            isOpen={userMenuOpen}
            position={dropdownPosition}
            onMouseEnter={handleUserMenuMouseEnter}
            onMouseLeave={handleUserMenuMouseLeave}
            onClose={() => setUserMenuOpen(false)}
            items={userMenuItems}
          />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;