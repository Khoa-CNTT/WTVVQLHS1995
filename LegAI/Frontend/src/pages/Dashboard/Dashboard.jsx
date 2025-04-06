import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import UsersManagerPage from './UsersManager/UsersManager';

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

  // Mô phỏng hiệu ứng đếm số mượt hơn
  useEffect(() => {
    const targetCounts = { documents: 15, cases: 5, appointments: 3, contracts: 2 };
    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60 fps
    const totalFrames = Math.round(duration / frameDuration);

    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const updatedCounts = {};

      Object.keys(targetCounts).forEach(key => {
        updatedCounts[key] = Math.floor(progress * targetCounts[key]);
        if (frame === totalFrames) {
          updatedCounts[key] = targetCounts[key];
        }
      });

      setStatCounts(updatedCounts);

      if (frame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, []);

  // Hàm chuyển đến trang chủ
  const goToHomePage = () => {
    navigate('/');
  };

  // Hàm toggle sidebar
  const toggleSidebar = () => {
    setMenuVisible(!menuVisible);
  };

  // Danh sách menu dựa trên cấu trúc cơ sở dữ liệu
  const menuItems = [
    { id: 'tổng-quan', label: 'Tổng Quan', icon: '⚖️' },
    { id: 'người-dùng', label: 'Tài Khoản', icon: '👨‍⚖️', table: 'Users, UserProfiles' },
    { id: 'tài-liệu-pháp-lý', label: 'Tài Liệu Pháp Lý', icon: '📜', table: 'LegalDocuments, DocumentTemplates' },
    { id: 'vụ-án', label: 'Vụ Án Pháp Lý', icon: '🏛️', table: 'LegalCases' },
    { id: 'hợp-đồng', label: 'Hợp Đồng', icon: '📋', table: 'Contracts, DigitalSignatures' },
    { id: 'lịch-hẹn', label: 'Lịch Hẹn', icon: '📅', table: 'Appointments, LawyerAvailability' },
    { id: 'tư-vấn-ai', label: 'Tư Vấn AI', icon: '🤖', table: 'AIConsultations' },
    { id: 'tin-nhắn', label: 'Tin Nhắn', icon: '💬', table: 'LiveChats' },
    { id: 'giao-dịch', label: 'Giao Dịch', icon: '💰', table: 'Transactions, FeeReferences' }
  ];

  // Nội dung giả lập cho Tổng Quan
  const renderDashboardOverview = () => {
    return (
      <>
        <h2 className={styles.sectionTitle}>Tổng Quan Hoạt Động</h2>
        <div className={styles.legalQuote}>
          "Công lý không chỉ phải được thực thi, mà còn phải được nhìn thấy là đang được thực thi"
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.legalIcon}>📄</span>
              Tài Liệu Pháp Lý
            </div>
            <div className={styles.cardContent}>
              <p><span className={styles.statNumber}>{statCounts.documents}</span> tài liệu mới được cập nhật</p>
              <small>Văn bản, luật, nghị định, mẫu hợp đồng</small>
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu('tài-liệu-pháp-lý')}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.legalIcon}>⚖️</span>
              Vụ Án Đang Xử Lý
            </div>
            <div className={styles.cardContent}>
              <p><span className={styles.statNumber}>{statCounts.cases}</span> vụ án đang chờ xử lý</p>
              <small>Các vụ án pháp lý đang được theo dõi và xử lý</small>
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu('vụ-án')}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.legalIcon}>📅</span>
              Lịch Hẹn Sắp Tới
            </div>
            <div className={styles.cardContent}>
              <p><span className={styles.statNumber}>{statCounts.appointments}</span> cuộc hẹn trong tuần này</p>
              <small>Các cuộc hẹn tư vấn với luật sư đã được đặt lịch</small>
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu('lịch-hẹn')}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.legalIcon}>📋</span>
              Hợp Đồng Mới
            </div>
            <div className={styles.cardContent}>
              <p><span className={styles.statNumber}>{statCounts.contracts}</span> hợp đồng cần xem xét</p>
              <small>Các hợp đồng mới cần xem xét và ký kết</small>
            </div>
            <button className={styles.actionButton} onClick={() => setActiveMenu('hợp-đồng')}>
              Xem Chi Tiết <span>→</span>
            </button>
          </div>
        </div>

        <div className={styles.legalDivider}></div>

        <h2 className={styles.sectionTitle}>Hoạt Động Gần Đây</h2>
        <div className={styles.recentActivities}>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>📝</span>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Tài liệu pháp lý "Luật doanh nghiệp 2023" được thêm vào</div>
              <div className={styles.activityTime}>2 giờ trước</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>👨‍⚖️</span>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Cuộc hẹn với Luật sư Nguyễn Văn A về vụ án kinh doanh</div>
              <div className={styles.activityTime}>Hôm qua, 15:30</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>💰</span>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Giao dịch thanh toán tư vấn luật sự hoàn tất - 2.500.000đ</div>
              <div className={styles.activityTime}>3 ngày trước</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>📋</span>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Hợp đồng mua bán đã được ký kết với chữ ký điện tử</div>
              <div className={styles.activityTime}>5 ngày trước</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Nội dung cho phần tài khoản dựa vào bảng Users và UserProfiles
  const renderUserProfile = () => {
    return (
      <>
        <h2 className={styles.sectionTitle}>Quản lý tài khoản người dùng</h2>
        <UsersManagerPage />
      </>
    );
  };

  // Hiển thị nội dung tương ứng với menu được chọn
  const renderContent = () => {
    switch (activeMenu) {
      case 'tổng-quan':
        return <div className={styles.contentSection}>{renderDashboardOverview()}</div>;
      case 'người-dùng':
        return (
          <div className={styles.contentSection}>
            {renderUserProfile()}
          </div>
        );
      case 'tài-liệu-pháp-lý':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Tài Liệu Pháp Lý</h2>
          </div>
        );
      case 'vụ-án':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Vụ Án Pháp Lý</h2>
          </div>
        );
      case 'hợp-đồng':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Quản Lý Hợp Đồng</h2>
          </div>
        );
      case 'lịch-hẹn':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Lịch Hẹn</h2>
          </div>
        );
      case 'tư-vấn-ai':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Tư Vấn AI</h2>
          </div>
        );
      case 'tin-nhắn':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Tin Nhắn</h2>
          </div>
        );
      case 'giao-dịch':
        return (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Giao Dịch</h2>
          </div>
        );
      default:
        return <div className={styles.contentSection}>Chọn một mục từ menu</div>;
    }
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${!menuVisible ? styles.sidebarCollapsed : ''}`}>
        <div
          className={styles.logoContainer}
          onClick={goToHomePage}
          title="Về trang chủ"
        >
          <h2>LegAI</h2>
        </div>
        <div className={styles.menuContainer}>
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
              onClick={() => setActiveMenu(item.id)}
              title={item.table ? `Bảng dữ liệu: ${item.table}` : item.label}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {menuVisible && <span className={styles.menuLabel}>{item.label}</span>}
            </div>
          ))}
        </div>
        <div className={styles.logoutContainer}>
          <button className={styles.logoutButton} onClick={() => localStorage.removeItem('token')}>
            🚪 {menuVisible ? 'Đăng xuất' : ''}
          </button>
        </div>
      </div>

      {/* Toggle Button for Sidebar - đặt bên ngoài sidebar */}
      <button className={styles.menuToggle} onClick={toggleSidebar}>
        {menuVisible ? '◀' : '▶'}
      </button>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1>HỆ THỐNG QUẢN LÝ PHÁP LÝ</h1>
            <div className={styles.currentDate}>{getCurrentDate()}</div>
          </div>
          <div className={styles.userInfo}>
            <div className={styles.notifications}>
              <span className={styles.notificationIcon}>🔔</span>
              {notifications > 0 && <span className={styles.notificationBadge}>{notifications}</span>}
            </div>
            <span className={styles.userName}>NGUYỄN VĂN A</span>
            <div className={styles.userAvatar}>NV</div>
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