import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import SideMenu from './SideMenu';
import NavLink from './NavLink';
import authService from '../../../services/authService';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Đảm bảo đóng menus khi chuyển trang
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsSideMenuOpen(false);
    setShowUserDropdown(false);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsSearchOpen(false);
      setShowUserDropdown(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setIsMenuOpen(false);
      setShowUserDropdown(false);
    }
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
    if (!isSideMenuOpen) {
      setShowUserDropdown(false);
    }
  };

  const toggleChat = (e, chatType) => {
    e.preventDefault();
    
    // Nếu không chỉ định loại chat, thì mở menu buttons
    if (!chatType) {
      // Gửi event hiển thị các nút chat
      const event = new CustomEvent('toggleChat', { 
        detail: { 
          action: 'open',
          chatType: 'buttons' // Hiển thị các nút chat
        } 
      });
      window.dispatchEvent(event);
      return;
    }
    
    // Nếu có chỉ định loại chat (ai hoặc human), mở cửa sổ chat tương ứng
    const newChatOpenState = !isChatOpen;
    setIsChatOpen(newChatOpenState);
    
    // Thông báo cho ChatManager thông qua một event với loại chat
    const event = new CustomEvent('toggleChat', { 
      detail: { 
        isOpen: newChatOpenState,
        action: newChatOpenState ? 'open' : 'close',
        chatType: chatType  // 'ai' hoặc 'human'
      } 
    });
    window.dispatchEvent(event);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
    if (!showUserDropdown) {
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setShowUserDropdown(false);
    navigate('/');
  };

  const navigateToDashboard = () => {
    // Xác định trang Dashboard dựa vào vai trò người dùng
    if (currentUser) {
      const role = currentUser.role?.toLowerCase() || '';
      
      if (role === 'admin') {
        navigate('/dashboard');
      } else if (role === 'lawyer') {
        navigate('/lawyer-dashboard');
      }
      // Người dùng thông thường không có trang dashboard
    } else {
      navigate('/login');
    }
  };

  // Lấy chữ cái đầu từ tên người dùng để hiển thị trong avatar
  const getUserInitials = () => {
    if (currentUser?.fullName) {
      const nameParts = currentUser.fullName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
      }
      return currentUser.fullName.charAt(0).toUpperCase();
    }
    return currentUser?.username?.charAt(0).toUpperCase() || 'U';
  };

  // Xử lý sự kiện tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    // Không cần kiểm tra searchTerm.trim() nữa
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setIsSearchOpen(false);
    setSearchTerm('');
  };
  
  // Xử lý sự kiện nhấn phím trong ô tìm kiếm
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Điều hướng đến trang văn bản pháp luật
  const navigateToDocuments = () => {
    navigate('/documents');
  };
  const navigateToTemplates = () => {
    navigate('/templates');
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className={`
      ${styles.navbar} 
      ${isScrolled ? styles.navbarScrolled : ''} 
      ${isHomePage ? styles.homeNavbar : ''}
    `}>
      <div className={styles.navbarContainer}>
      <Link to="/" className={styles.logo}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          className={styles.logoImg} 
        />
        <span className={styles.logoText}>LegAI</span>
      </Link>
      
      <div className={isMenuOpen ? styles.navLinksOpen : styles.navLinks}>
        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
          <li>
            <NavLink to="/">Trang chủ</NavLink>
          </li>
          <li>
            <NavLink to="/legal-docs">Hồ sơ pháp lý</NavLink>
          </li>
            <li>
              <NavLink to="/contracts">Hợp đồng</NavLink>
            </li>
          <li>
            <NavLink to="/services">Dịch vụ</NavLink>
          </li>
          <li>
            <NavLink to="/lawyers">Luật sư</NavLink>
          </li>
          <li>
            <NavLink to="/documents">Văn bản pháp luật</NavLink>
          </li>
          <li>
            <NavLink to="/templates">Mẫu đơn</NavLink>
          </li>
          <li>
            <NavLink to="/news">Tin tức</NavLink>
          </li>
          <li>
            <NavLink to="/contact">Liên hệ</NavLink>
          </li>
        </ul>
      </div>
      
      <div className={styles.navIcons}>
        <div className={`${styles.searchWrapper} ${isSearchOpen ? styles.searchActive : ''}`}>
          <button onClick={toggleSearch} className={styles.icon} aria-label="Tìm kiếm">
            <i className="fas fa-search"></i>
            <span className={styles.iconLabel}>Tìm kiếm</span>
          </button>
          <div className={styles.searchDropdown}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input 
                type="text" 
                placeholder="Tìm kiếm văn bản pháp luật, mẫu đơn..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button 
                type="submit"
                className={styles.searchBtn} 
                aria-label="Tìm kiếm"
              >
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
        </div>
        
        
        <div className={styles.rightControls}>
          {currentUser && (currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'lawyer') && (
            <div className={styles.icon} onClick={navigateToDashboard} title={currentUser.role?.toLowerCase() === 'admin' ? 'Bảng điều khiển Admin' : 'Bảng điều khiển Luật Sư'}>
              <i className="fas fa-tachometer-alt"></i>
              <span className={styles.iconLabel}>
                {currentUser.role?.toLowerCase() === 'admin' ? 'Admin' : 'Luật Sư'}
              </span>
            </div>
          )}
          
          {currentUser ? (
            <div className={styles.userMenuContainer}>
              <div 
                className={styles.userAvatar} 
                onClick={toggleUserDropdown}
              >
                <span className={styles.userInitial}>{getUserInitials()}</span>
              </div>
              
              {showUserDropdown && (
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{currentUser.fullName || currentUser.username}</div>
                    <div className={styles.userEmail}>{currentUser.email}</div>
                  </div>
                  <div className={styles.userMenuDivider}></div>
                  <div className={styles.userMenuItem} onClick={() => navigate('/profile')}>
                    <i className="fas fa-user"></i> Hồ sơ
                  </div>
                  {currentUser.role?.toLowerCase() === 'admin' && (
                    <div className={styles.userMenuItem} onClick={() => navigate('/dashboard')}>
                      <i className="fas fa-tachometer-alt"></i> Quản trị
                    </div>
                  )}
                  {currentUser.role?.toLowerCase() === 'lawyer' && (
                    <div className={styles.userMenuItem} onClick={() => navigate('/lawyer-dashboard')}>
                      <i className="fas fa-gavel"></i> Bảng điều khiển
                    </div>
                  )}
                  <div className={styles.userMenuItem} onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Đăng xuất
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={`${styles.icon} ${styles.loginIcon}`}>
              <i className="fas fa-user"></i>
              <span className={styles.iconLabel}>Đăng nhập</span>
            </Link>
          )}
          
            <button onClick={toggleSideMenu} className={styles.menuButton} aria-label="Menu">
            <div className={`${styles.hamburger} ${isSideMenuOpen ? styles.active : ''}`}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </div>
          </button>
          </div>
        </div>
      </div>

      {/* Sử dụng component SideMenu */}
      <SideMenu 
        isOpen={isSideMenuOpen} 
        onClose={toggleSideMenu} 
        currentUser={currentUser} 
        onLogout={handleLogout}
      />
    </nav>
  );
};

export default Navbar; 