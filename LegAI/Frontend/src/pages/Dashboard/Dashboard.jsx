import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import UsersManagerPage from './UsersManager/UsersManager';
import authService from '../../services/authService';
import 'animate.css';

function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('tổng-quan');
  const [statCounts, setStatCounts] = useState({
    documents: 0,
    cases: 0,
    appointments: 0,
    contracts: 0
  });
  const [notifications, setNotifications] = useState(3);
  const [menuVisible, setMenuVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const goToHomePage = () => navigate('/');
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  const toggleSidebar = () => setMenuVisible(!menuVisible);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  const goToProfilePage = () => navigate('/profile');

  const menuItems = [
    { id: 'tổng-quan', label: 'Tổng Quan', icon: '⚖️' },
    { id: 'người-dùng', label: 'Tài Khoản', icon: '👨‍⚖️', table: 'Users, UserProfiles' },
    { id: 'tài-liệu-pháp-lý', label: 'Tài Liệu Pháp Lý', icon: '📜', table: 'LegalDocuments, DocumentTemplates' },
    { id: 'vụ-án', label: 'Vụ Án Pháp Lý', icon: '🏛️', table: 'LegalCases' },
    { id: 'hợp-đồng', label: 'Hợp Đồng', icon: '📋', table: 'Contracts, DigitalSignatures' },
    { id: 'tư-vấn-ai', label: 'Tư Vấn AI', icon: '🤖', table: 'AIConsultations' },
    { id: 'tin-nhắn', label: 'Tin Nhắn', icon: '💬', table: 'LiveChats' },
    { id: 'giao-dịch', label: 'Giao Dịch', icon: '💰', table: 'Transactions, FeeReferences' }
  ];

  const renderDashboardOverview = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <h2 className={styles.sectionTitle}>Tổng Quan Hoạt Động</h2>
      <div className={styles.legalQuote}>
        "Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy là đang được thực thi"
      </div>
      <div className={styles.cardGrid}>
        {[
          { icon: '📄', title: 'Tài Liệu Pháp Lý', stat: statCounts.documents, desc: 'tài liệu mới được cập nhật', subDesc: 'Văn bản, luật, nghị định, mẫu hợp đồng', menu: 'tài-liệu-pháp-lý' },
          { icon: '⚖️', title: 'Vụ Án Đang Xử Lý', stat: statCounts.cases, desc: 'vụ án đang chờ xử lý', subDesc: 'Các vụ án pháp lý đang được theo dõi và xử lý', menu: 'vụ-án' },
          { icon: '📅', title: 'Lịch Hẹn Sắp Tới', stat: statCounts.appointments, desc: 'cuộc hẹn trong tuần này', subDesc: 'Các cuộc hẹn tư vấn với luật sư đã được đặt lịch', menu: 'lịch-hẹn' },
          { icon: '📋', title: 'Hợp Đồng Mới', stat: statCounts.contracts, desc: 'hợp đồng cần xem xét', subDesc: 'Các hợp đồng mới cần xem xét và ký kết', menu: 'hợp-đồng' }
        ].map(({ icon, title, stat, desc, subDesc, menu }, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.legalIcon}>{icon}</span>
              {title}
            </div>
            <div className={styles.cardContent}>
              <p><span className={styles.statNumber}>{stat}</span> {desc}</p>
              <small>{subDesc}</small>
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu(menu)}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>
        ))}
      </div>
      <div className={styles.legalDivider}></div>
      <h2 className={styles.sectionTitle}>Hoạt Động Gần Đây</h2>
      <div className={styles.recentActivities}>
        {[
          { icon: '📝', title: 'Tài liệu pháp lý "Luật doanh nghiệp 2023" được thêm vào', time: '2 giờ trước' },
          { icon: '👨‍⚖️', title: 'Cuộc hẹn với Luật sư Nguyễn Văn A về vụ án kinh doanh', time: 'Hôm qua, 15:30' },
          { icon: '💰', title: 'Giao dịch thanh toán tư vấn luật sư hoàn tất - 2.500.000đ', time: '3 ngày trước' },
          { icon: '📋', title: 'Hợp đồng mua bán đã được ký kết với chữ ký điện tử', time: '5 ngày trước' }
        ].map(({ icon, title, time }, index) => (
          <div key={index} className={`${styles.activityItem} animate__animated animate__slideInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
            <span className={styles.activityIcon}>{icon}</span>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>{title}</div>
              <div className={styles.activityTime}>{time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUserProfile = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <h2 className={styles.sectionTitle}>Quản lý tài khoản người dùng</h2>
      <UsersManagerPage />
    </div>
  );

  const renderContent = () => {
    const sections = {
      'tổng-quan': renderDashboardOverview(),
      'người-dùng': renderUserProfile(),
      'tài-liệu-pháp-lý': <h2 className={styles.sectionTitle}>Tài Liệu Pháp Lý</h2>,
      'vụ-án': <h2 className={styles.sectionTitle}>Vụ Án Pháp Lý</h2>,
      'hợp-đồng': <h2 className={styles.sectionTitle}>Quản Lý Hợp Đồng</h2>,
      'tư-vấn-ai': <h2 className={styles.sectionTitle}>Tư Vấn AI</h2>,
      'tin-nhắn': <h2 className={styles.sectionTitle}>Tin Nhắn</h2>,
      'giao-dịch': <h2 className={styles.sectionTitle}>Giao Dịch</h2>
    };
    return (
      <div className={styles.contentSection}>
        {sections[activeMenu] || 'Chọn một mục từ menu'}
      </div>
    );
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

  return (
    <div className={`${styles.dashboardContainer} ${!menuVisible ? styles.sidebarCollapsed : ''}`}>
      <div className={`${styles.sidebar} ${!menuVisible ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoContainer} onClick={goToHomePage} title="Về trang chủ">
          <h2>LegAI</h2>
        </div>
        <div className={styles.menuContainer}>
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''} animate__animated animate__fadeIn`}
              onClick={() => setActiveMenu(item.id)}
              title={item.table ? `Bảng dữ liệu: ${item.table}` : item.label}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {menuVisible && <span className={styles.menuLabel}>{item.label}</span>}
            </div>
          ))}
        </div>
        <div className={styles.logoutContainer}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            🚪 {menuVisible ? 'Đăng xuất' : ''}
          </button>
        </div>
      </div>
      <button className={styles.menuToggle} onClick={toggleSidebar}>
        {menuVisible ? '◀' : '▶'}
      </button>
      <div className={styles.mainContent}>
        <div className={`${styles.header} animate__animated animate__fadeInDown`}>
          <div>
            <h1>HỆ THỐNG QUẢN LÝ PHÁP LÝ</h1>
            <div className={styles.currentDate}>{getCurrentDate()}</div>
          </div>
          <div className={styles.userInfo}>
            <div className={styles.notifications}>
              <span className={styles.notificationIcon}>🔔</span>
              {notifications > 0 && <span className={styles.notificationBadge}>{notifications}</span>}
            </div>
            <span className={styles.userName}>{currentUser?.fullName || currentUser?.username || 'NGƯỜI DÙNG'}</span>
            <div className={styles.userAvatar} onClick={toggleUserMenu}>
              {getUserInitials()}
              {userMenuOpen && (
                <div className={`${styles.userDropdownMenu} animate__animated animate__fadeIn`}>
                  {[
                    { icon: '🏠', label: 'Trang chủ', onClick: () => navigate('/') },
                    { icon: '👤', label: 'Hồ sơ', onClick: goToProfilePage },
                    { icon: '🚪', label: 'Đăng xuất', onClick: handleLogout }
                  ].map(({ icon, label, onClick }, index) => (
                    <div key={index} className={styles.userMenuItem} onClick={onClick}>
                      <span>{icon}</span> {label}
                    </div>
                  ))}
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
}

export default Dashboard;