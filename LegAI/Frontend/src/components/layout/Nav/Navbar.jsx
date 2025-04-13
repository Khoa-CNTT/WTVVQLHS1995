import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setIsMenuOpen(false);
    }
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  const toggleChat = (e) => {
    e.preventDefault();
    
    // Gửi event với giá trị state mới (sau khi toggle)
    const newChatOpenState = !isChatOpen;
    setIsChatOpen(newChatOpenState);
    
    // Thông báo cho ChatManager thông qua một event
    const event = new CustomEvent('toggleChat', { 
      detail: { 
        isOpen: newChatOpenState,
        action: newChatOpenState ? 'open' : 'close'
      } 
    });
    window.dispatchEvent(event);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
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

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
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
            <NavLink to="/services">Dịch vụ</NavLink>
          </li>
          <li>
            <NavLink to="/lawyers">Luật sư</NavLink>
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
          <button onClick={toggleSearch} className={styles.icon}>
            <i className="fas fa-search"></i>
          </button>
          <div className={styles.searchDropdown}>
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
            <button className={styles.searchBtn}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
        
        <div className={styles.rightControls}>
          <a href="#" 
            className={`${styles.icon} ${styles.messageIcon} ${isChatOpen ? styles.active : ''}`}
            onClick={toggleChat}
          >
            <i className="fas fa-comment-dots"></i>
            <span className={styles.iconLabel}>Nhắn tin</span>
          </a>
          
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
          
          <button onClick={toggleSideMenu} className={styles.menuButton}>
            <div className={`${styles.hamburger} ${isSideMenuOpen ? styles.active : ''}`}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </div>
          </button>
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