import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Dashboard() {
  const navigate = useNavigate();
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
  const [menuVisible, setMenuVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuTimeoutRef = useRef(null);
  const userAvatarRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const notificationRef = useRef(null);

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
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const goToHomePage = () => navigate('/');
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  const toggleSidebar = () => setMenuVisible(!menuVisible);
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
    { id: 'tổng-quan', label: 'Tổng Quan', icon: '⚖️' },
    { id: 'người-dùng', label: 'Tài Khoản', icon: '👨‍⚖️', table: 'Users, UserProfiles' },
    { id: 'tài-liệu-pháp-lý', label: 'Tài Liệu Pháp Lý', icon: '📜', table: 'LegalDocuments, DocumentTemplates' },
    { id: 'vụ-án', label: 'Mẫu văn bản', icon: '🏛️', table: 'LegalCases' },
    { id: 'hợp-đồng', label: 'Hợp Đồng', icon: '📋', table: 'Contracts, DigitalSignatures' },
    { id: 'tư-vấn-ai', label: 'Tư Vấn AI', icon: '🤖', table: 'AIConsultations' },
    { id: 'tin-nhắn', label: 'Tin Nhắn', icon: '💬', table: 'LiveChats' },
    { id: 'giao-dịch', label: 'Giao Dịch', icon: '💰', table: 'Transactions, FeeReferences' }
  ];

  const userMenuItems = [
    { icon: '🏠', label: 'Trang chủ', onClick: () => navigate('/') },
    { icon: '👤', label: 'Hồ sơ', onClick: goToProfilePage },
    { icon: '🚪', label: 'Đăng xuất', onClick: handleLogout }
  ];

  const renderDashboardOverview = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <UpdateNotification />
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

  const renderLegalDocuments = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <h2 className={styles.sectionTitle}>Quản lý tài liệu pháp lý
        <button className={styles.updateButton} onClick={handleScrapeLegalDocuments}>Cập nhật dữ liệu mới từ thư viện pháp luật</button>
      </h2>
      <LegalDocumentsManager />
    </div>
  );

  const renderDocumentTemplates = () => (
    <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
      <h2 className={styles.sectionTitle}>Quản lý mẫu văn bản
      <button className={styles.updateButton} onClick={handleScrapeContracts}>Cập nhật dữ liệu mới từ thư viện pháp luật</button>
      </h2>
      <DocumentTemplatesManager />
    </div>
  );

  const renderContent = () => {
    const sections = {
      'tổng-quan': renderDashboardOverview(),
      'người-dùng': renderUserProfile(),
      'tài-liệu-pháp-lý': renderLegalDocuments(),
      'vụ-án': renderDocumentTemplates(),
      'hợp-đồng': (
        <div className={`${styles.contentSection} animate__animated animate__fadeIn`}>
          <h2 className={styles.sectionTitle}>Quản Lý Hợp Đồng
            <button className={styles.updateButton} onClick={handleScrapeContracts}>Cập nhật hợp đồng mới từ thư viện pháp luật</button>
          </h2>
          <div className={styles.comingSoon}>Tính năng đang được phát triển</div>
        </div>
      ),
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
            <div className={styles.notifications} ref={notificationRef}>
              <span 
                className={styles.notificationIcon} 
                onClick={toggleNotifications}
              >
                🔔
              </span>
              {notifications > 0 && 
                <span className={styles.notificationBadge}>{notifications}</span>
              }
              
              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <h3 className={styles.notificationTitle}>Thông báo cập nhật</h3>
                  
                  {notificationsLoading ? (
                    <div className={styles.notificationLoading}>
                      <div className={styles.spinner}></div>
                      <p>Đang tải thông báo...</p>
                    </div>
                  ) : notificationItems.length > 0 ? (
                    <div className={styles.notificationList}>
                      {notificationItems.map(item => (
                        <div key={item.id} className={styles.notificationItem}>
                          <div className={styles.notificationContent}>
                            <p className={styles.notificationDetails}>{item.details}</p>
                            <p className={styles.notificationTime}>{formatDateTime(item.created_at)}</p>
                          </div>
                          <button 
                            className={styles.markReadButton}
                            onClick={() => handleMarkAsRead(item.id)}
                            title="Đánh dấu đã đọc"
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyNotification}>
                      <span className={styles.emptyIcon}>📭</span>
                      <p>Không có thông báo mới</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className={styles.userName}>{currentUser?.fullName || currentUser?.username || 'NGƯỜI DÙNG'}</span>
            <div 
              ref={userAvatarRef}
              className={styles.userAvatar} 
              onClick={toggleUserMenu}
              onMouseEnter={handleUserMenuMouseEnter}
              onMouseLeave={handleUserMenuMouseLeave}
            >
              {getUserInitials()}
            </div>
            
            <UserMenuPortal 
              isOpen={userMenuOpen}
              position={dropdownPosition}
              onMouseEnter={handleUserMenuMouseEnter}
              onMouseLeave={handleUserMenuMouseLeave}
              onClose={() => setUserMenuOpen(false)}
              items={userMenuItems}
            />
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