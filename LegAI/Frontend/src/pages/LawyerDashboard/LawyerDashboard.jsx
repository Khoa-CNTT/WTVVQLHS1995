import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../Dashboard/DashboardPage.module.css';
import authService from '../../services/authService';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import chatService from '../../services/chatService';
import AppointmentsManager from './components/AppointmentsManager';
import AvailabilityManager from './components/AvailabilityManager';
import ChatManager from './components/ChatManager';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Làm mới thông tin người dùng từ server
        let user = await userService.refreshUserData();
        
        if (!user) {
          // Thử lấy từ localStorage nếu không làm mới được
          user = authService.getCurrentUser();
        }
        
        
        // Kiểm tra role, không phân biệt chữ hoa/thường
        if (!user || (user.role?.toLowerCase() !== 'lawyer' && user.role?.toLowerCase() !== 'admin')) {
          navigate('/login');
          return;
        }
        
        setCurrentUser(user);
        
        // Lấy dữ liệu thực tế từ API
        try {
          // Lấy số lượng lịch hẹn
          const appointmentStatsResponse = await appointmentService.getAppointmentStats();
          if (appointmentStatsResponse.status === 'success') {
            // Tổng số lịch hẹn đang chờ xác nhận
            const pendingAppointments = appointmentStatsResponse.data.pending || 0;
            setAppointmentCount(pendingAppointments);
          }
          
          // Lấy số lượng tin nhắn chưa đọc
          try {
            const unreadCount = await chatService.countUnreadMessages();
            setUnreadMessages(unreadCount);
            setPendingCount(unreadCount); // Cập nhật vào pendingCount cho hiển thị trên menu
          } catch (error) {
            console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error);
            setPendingCount(0);
          }
          
          // Giả lập các số liệu khác
          setCaseCount(24);    // Vụ án đang xử lý
          setDocumentCount(35); // Tài liệu cần xem xét
        } catch (error) {
          console.error('Lỗi khi lấy thống kê:', error);
          // Fallback về giá trị mặc định nếu có lỗi
          setPendingCount(0);
          setAppointmentCount(0);
          setCaseCount(24);
          setDocumentCount(35);
        }
        
        // Load notifications
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
    
    // Thiết lập interval để cập nhật số lượng tin nhắn chưa đọc
    const interval = setInterval(async () => {
      try {
        const unreadCount = await chatService.countUnreadMessages();
        setUnreadMessages(unreadCount);
        setPendingCount(unreadCount);
      } catch (error) {
        console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error);
      }
    }, 30000); // Cập nhật mỗi 30 giây
    
    return () => clearInterval(interval);
  }, [navigate]);

  const navigateToHome = () => {
    navigate('/');
  };
  
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
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const toggleUserMenu = () => {
    setUserProfileOpen(!userProfileOpen);
  };
  
  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'chart-line' },
    { id: 'messages', label: 'Tin nhắn', icon: 'envelope', count: pendingCount },
    { id: 'cases', label: 'Vụ án', icon: 'balance-scale', count: caseCount },
    { id: 'appointments', label: 'Lịch hẹn', icon: 'calendar-alt', count: appointmentCount },
    { id: 'availability', label: 'Quản lý lịch trống', icon: 'calendar-plus' },
    { id: 'documents', label: 'Tài liệu', icon: 'file-alt', count: documentCount },
    { id: 'contracts', label: 'Hợp đồng', icon: 'file-signature' },
    { id: 'clients', label: 'Khách hàng', icon: 'users' },
    { id: 'transactions', label: 'Giao dịch', icon: 'money-bill-wave' },
    { id: 'specialties', label: 'Chuyên môn', icon: 'graduation-cap' },
  ];
  
  const renderOverview = () => (
    <div>
      <h1 className={styles.sectionTitle}>Tổng quan Luật sư</h1>
      <div className={styles.legalQuote}>
        "Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy đang được thực thi."
      </div>
      
      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <i className={`fas fa-envelope ${styles.legalIcon}`}></i>
            Tin nhắn chưa đọc
          </div>
          <div className={styles.cardContent}>
            <span className={styles.statNumber}>{pendingCount}</span> tin nhắn
          </div>
          <button className={styles.actionButton} onClick={() => setActiveMenu('messages')}>
            Xem tất cả <span>&rarr;</span>
          </button>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <i className={`fas fa-calendar-alt ${styles.legalIcon}`}></i>
            Lịch hẹn sắp tới
          </div>
          <div className={styles.cardContent}>
            <span className={styles.statNumber}>{appointmentCount}</span> cuộc hẹn
          </div>
          <button className={styles.actionButton} onClick={() => setActiveMenu('appointments')}>
            Quản lý lịch <span>&rarr;</span>
          </button>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <i className={`fas fa-balance-scale ${styles.legalIcon}`}></i>
            Vụ án đang xử lý
          </div>
          <div className={styles.cardContent}>
            <span className={styles.statNumber}>{caseCount}</span> vụ án
          </div>
          <button className={styles.actionButton}>
            Xem chi tiết <span>&rarr;</span>
          </button>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <i className={`fas fa-file-alt ${styles.legalIcon}`}></i>
            Tài liệu cần xem xét
          </div>
          <div className={styles.cardContent}>
            <span className={styles.statNumber}>{documentCount}</span> tài liệu
          </div>
          <button className={styles.actionButton}>
            Xem tài liệu <span>&rarr;</span>
          </button>
        </div>
      </div>
      
      <div className={styles.legalDivider}></div>
      
      <div className={styles.recentActivities}>
        <h2 className={styles.subSectionTitle}>Hoạt động gần đây</h2>
        
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <i className={`fas fa-${notification.icon}`}></i>
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>{notification.message}</div>
              <div className={styles.activityTime}>{notification.time}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.rowContainer}>
        <div className={styles.halfWidth}>
          <h2 className={styles.subSectionTitle}>Lịch hẹn sắp tới</h2>
          <ul className={styles.dataFields}>
            <li>Gặp khách hàng Nguyễn Văn A - <strong>9:00 AM, Hôm nay</strong></li>
            <li>Tư vấn luật doanh nghiệp - <strong>11:30 AM, Hôm nay</strong></li>
            <li>Hòa giải vụ kiện lao động - <strong>14:00 PM, Hôm nay</strong></li>
            <li>Thảo luận hợp đồng với Công ty X - <strong>9:30 AM, Ngày mai</strong></li>
          </ul>
        </div>
        
        <div className={styles.halfWidth}>
          <h2 className={styles.subSectionTitle}>Thống kê tháng này</h2>
          <ul className={styles.dataFields}>
            <li>Vụ án đã xử lý: <strong>8</strong></li>
            <li>Lịch hẹn đã hoàn thành: <strong>24</strong></li>
            <li>Tài liệu đã duyệt: <strong>35</strong></li>
            <li>Khách hàng mới: <strong>12</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
  
  const renderMessages = () => (
      <div className={styles.contentSection}>
      <ChatManager />
    </div>
  );
  
  const renderCases = () => (
    <div>
      <h1 className={styles.sectionTitle}>Vụ án</h1>
      <p className={styles.sectionDescription}>
        Quản lý và theo dõi tất cả các vụ án pháp lý đang xử lý.
      </p>
      {/* Nội dung chi tiết phần vụ án sẽ được thêm sau */}
      <div className={styles.contentSection}>
        <div className={styles.legalQuote}>
          Tính năng này đang được phát triển. Sẽ sớm ra mắt!
        </div>
      </div>
    </div>
  );
  
  const renderAppointments = () => (
    <div>
      <div className={styles.contentSection}>
        <AppointmentsManager />
      </div>
    </div>
  );
  
  const renderAvailability = () => (
    <div>
      <div className={styles.contentSection}>
        <AvailabilityManager />
      </div>
    </div>
  );
  
  const renderDocuments = () => (
    <div>
      <h1 className={styles.sectionTitle}>Tài liệu</h1>
      <p className={styles.sectionDescription}>
        Quản lý và xem xét các tài liệu pháp lý, hợp đồng và hồ sơ vụ án.
      </p>
      {/* Nội dung chi tiết phần tài liệu sẽ được thêm sau */}
      <div className={styles.contentSection}>
        <div className={styles.legalQuote}>
          Tính năng này đang được phát triển. Sẽ sớm ra mắt!
        </div>
      </div>
    </div>
  );
  
  const renderContent = () => {
    switch (activeMenu) {
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
      default:
        return renderOverview();
    }
  };
  
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoContainer} onClick={navigateToHome}>
          <h2>LegAI</h2>
        </div>
        
        <button
          className={styles.menuToggle}
          onClick={toggleSidebar}
        >
          <i className={`fas ${isSidebarCollapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
        </button>
        
        <div className={styles.menuContainer}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <i className={`fas fa-${item.icon} ${styles.menuIcon}`}></i>
              <span className={styles.menuLabel}>{item.label}</span>
              {item.count > 0 && !isSidebarCollapsed && (
                <span className={styles.notificationBadge}>{item.count}</span>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles.logoutContainer}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <i className="fas fa-sign-out-alt"></i>
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Đăng xuất</span>}
          </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1>{activeMenu === 'overview' ? 'Bảng điều khiển Luật sư' : menuItems.find(item => item.id === activeMenu)?.label}</h1>
            <div className={styles.currentDate}>{getCurrentDate()}</div>
          </div>
          
          <div className={styles.userInfo}>
            <div className={styles.notifications}>
              <i className={`fas fa-bell ${styles.notificationIcon}`}></i>
              <span className={styles.notificationBadge}>4</span>
            </div>
            
            {currentUser.fullName && <div className={styles.userName}>{currentUser.fullName}</div>}
            
            <div className={styles.userAvatar} onClick={toggleUserMenu}>
              {getInitials(currentUser.fullName)}
              
              {userProfileOpen && (
                <div className={styles.userDropdownMenu}>
                  <div className={styles.userMenuItem} onClick={navigateToProfile}>
                    <i className="fas fa-user"></i>
                    Hồ sơ của tôi
                  </div>
                  <div className={styles.userMenuItem} onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Đăng xuất
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.contentWrapper}>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard; 