import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LawyerDashboard.module.css';
import authService from '../../services/authService';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import chatService from '../../services/chatService';
import AppointmentsManager from './components/AppointmentsManager';
import AvailabilityManager from './components/AvailabilityManager';
import ChatManager from './components/ChatManager';
import ContactForm from '../Contact/ContactForm';
import 'animate.css';

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
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleUserMenu = () => setUserProfileOpen(!userProfileOpen);

  const menuItems = [
    { id: 'overview', label: 'Tổng Quan', icon: 'chart-line', count: 0 },
    { id: 'messages', label: 'Tin Nhắn', icon: 'envelope', count: pendingCount },
    { id: 'cases', label: 'Vụ Án', icon: 'balance-scale', count: caseCount },
    { id: 'appointments', label: 'Lịch Hẹn', icon: 'calendar-alt', count: appointmentCount },
    { id: 'availability', label: 'Quản Lý Lịch Trống', icon: 'calendar-plus', count: 0 },
    { id: 'documents', label: 'Tài Liệu', icon: 'file-alt', count: documentCount },
    { id: 'contracts', label: 'Hợp Đồng', icon: 'file-signature', count: 0 },
    { id: 'clients', label: 'Khách Hàng', icon: 'users', count: 0 },
    { id: 'contact', label: 'Liên Hệ', icon: 'phone', count: 0 },
    { id: 'transactions', label: 'Giao Dịch', icon: 'money-bill-wave', count: 0 },
    { id: 'specialties', label: 'Chuyên Môn', icon: 'graduation-cap', count: 0 },
  ];

  const renderOverview = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <h1 className={styles.sectionTitle}>Tổng Quan Luật Sư</h1>
      <div className={styles.legalQuote}>
        "Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy đang được thực thi."
      </div>
      <div className={styles.cardGrid}>
        {[
          { icon: 'envelope', title: 'Tin Nhắn Chưa Đọc', stat: pendingCount, desc: 'tin nhắn', menu: 'messages' },
          { icon: 'calendar-alt', title: 'Lịch Hẹn Sắp Tới', stat: appointmentCount, desc: 'cuộc hẹn', menu: 'appointments' },
          { icon: 'balance-scale', title: 'Vụ Án Đang Xử Lý', stat: caseCount, desc: 'vụ án', menu: 'cases' },
          { icon: 'file-alt', title: 'Tài Liệu Cần Xem Xét', stat: documentCount, desc: 'tài liệu', menu: 'documents' },
        ].map(({ icon, title, stat, desc, menu }, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardTitle}>
              <i className={`fas fa-${icon} ${styles.legalIcon}`}></i>
              {title}
            </div>
            <div className={styles.cardContent}>
              <span className={styles.statNumber}>{stat}</span> {desc}
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu(menu)}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>
        ))}
      </div>
      <div className={styles.legalDivider}></div>
      <div className={styles.recentActivities}>
        <h2 className={styles.subSectionTitle}>Hoạt Động Gần Đây</h2>
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`${styles.activityItem} animate__animated animate__slideInUp`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
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
          <h2 className={styles.subSectionTitle}>Lịch Hẹn Sắp Tới</h2>
          <ul className={styles.dataFields}>
            <li>Gặp khách hàng Nguyễn Văn A - <strong>9:00 AM, Hôm nay</strong></li>
            <li>Tư vấn luật doanh nghiệp - <strong>11:30 AM, Hôm nay</strong></li>
            <li>Hòa giải vụ kiện lao động - <strong>14:00 PM, Hôm nay</strong></li>
            <li>Thảo luận hợp đồng với Công ty X - <strong>9:30 AM, Ngày mai</strong></li>
          </ul>
        </div>
        <div className={styles.halfWidth}>
          <h2 className={styles.subSectionTitle}>Thống Kê Tháng Này</h2>
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
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <ChatManager />
    </div>
  );

  const renderCases = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <p className={styles.sectionDescription}>
        Quản lý và theo dõi tất cả các vụ án pháp lý đang xử lý.
      </p>
      <div className={styles.legalQuote}>
        Tính năng này đang được phát triển. Sẽ sớm ra mắt!
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <AppointmentsManager />
    </div>
  );

  const renderAvailability = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <AvailabilityManager />
    </div>
  );

  const renderDocuments = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <p className={styles.sectionDescription}>
        Quản lý và xem xét các tài liệu pháp lý, hợp đồng và hồ sơ vụ án.
      </p>
      <div className={styles.legalQuote}>
        Tính năng này đang được phát triển. Sẽ sớm ra mắt!
      </div>
    </div>
  );

  const renderContact = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <p className={styles.sectionDescription}>
        Gửi thông tin liên hệ đến bộ phận hỗ trợ của LegAI.
      </p>
      <div className={styles.contactWrapper}>
        <ContactForm />
      </div>
    </div>
  );

  const renderContent = () => {
    const sections = {
      overview: renderOverview(),
      messages: renderMessages(),
      cases: renderCases(),
      appointments: renderAppointments(),
      availability: renderAvailability(),
      documents: renderDocuments(),
      contact: renderContact(),
      contracts: <h1 className={styles.sectionTitle}>Hợp Đồng</h1>,
      clients: <h1 className={styles.sectionTitle}>Khách Hàng</h1>,
      transactions: <h1 className={styles.sectionTitle}>Giao Dịch</h1>,
      specialties: <h1 className={styles.sectionTitle}>Chuyên Môn</h1>,
    };
    return sections[activeMenu] || renderOverview();
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

  return (
    <div className={`${styles.dashboardContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoContainer} onClick={navigateToHome}>
          <h2>LegAI</h2>
        </div>
        <button className={styles.menuToggle} onClick={toggleSidebar}>
          <i className={`fas ${isSidebarCollapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
        </button>
        <div className={styles.menuContainer}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''} animate__animated animate__fadeIn`}
              onClick={() => setActiveMenu(item.id)}
            >
              <i className={`fas fa-${item.icon} ${styles.menuIcon}`}></i>
              {!isSidebarCollapsed && <span className={styles.menuLabel}>{item.label}</span>}
              {item.count > 0 && !isSidebarCollapsed && (
                <span className={styles.notificationBadge}>{item.count}</span>
              )}
            </div>
          ))}
        </div>
        <div className={styles.logoutContainer}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <i className="fas fa-sign-out-alt"></i>
            {!isSidebarCollapsed && <span>Đăng Xuất</span>}
          </button>
        </div>
      </div>
      <div className={styles.mainContent}>
        <div className={`${styles.header} animate__animated animate__fadeInDown`}>
          <div>
            <h1>
              {activeMenu === 'overview'
                ? 'Bảng Điều Khiển Luật Sư'
                : menuItems.find((item) => item.id === activeMenu)?.label || 'Bảng Điều Khiển'}
            </h1>
            <div className={styles.currentDate}>{getCurrentDate()}</div>
          </div>
          <div className={styles.userInfo}>
            <div className={styles.notifications}>
              <i className={`fas fa-bell ${styles.notificationIcon}`}></i>
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>{notifications.length}</span>
              )}
            </div>
            {currentUser.fullName && (
              <div className={styles.userName}>{currentUser.fullName}</div>
            )}
            <div className={styles.userAvatar} onClick={toggleUserMenu}>
              {getInitials(currentUser.fullName)}
              {userProfileOpen && (
                <div className={`${styles.userDropdownMenu} animate__animated animate__fadeIn`}>
                  {[
                    { icon: 'user', label: 'Hồ Sơ Của Tôi', onClick: navigateToProfile },
                    { icon: 'sign-out-alt', label: 'Đăng Xuất', onClick: handleLogout },
                  ].map(({ icon, label, onClick }, index) => (
                    <div key={index} className={styles.userMenuItem} onClick={onClick}>
                      <i className={`fas fa-${icon}`}></i> {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.contentWrapper}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default LawyerDashboard;