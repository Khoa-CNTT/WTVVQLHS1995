import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import SideMenu from './SideMenu';
import NavLink from './NavLink';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
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
        <NavLink to="/">Trang chủ</NavLink>
        <NavLink to="/services">Dịch vụ</NavLink>
        <NavLink to="/lawyers">Luật sư</NavLink>
        <NavLink to="/news">Tin tức</NavLink>
        <NavLink to="/contact">Liên hệ</NavLink>
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
      <SideMenu isOpen={isSideMenuOpen} onClose={toggleSideMenu} />
    </nav>
  );
};

export default Navbar; 