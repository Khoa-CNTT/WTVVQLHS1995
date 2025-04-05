import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.logo}>
        <img 
          src="logo.png" 
          alt="Logo" 
          className={styles.logoImg} 
        />
        <span className={styles.logoText}>LegAI</span>
      </div>
      
      <div className={isMenuOpen ? styles.navLinksOpen : styles.navLinks}>
        <a href="#" className={styles.navLink}>Trang chủ</a>
        <a href="#" className={styles.navLink}>Dịch vụ</a>
        <a href="#" className={styles.navLink}>Luật sư</a>
        <a href="#" className={styles.navLink}>Tin tức</a>
        <a href="#" className={styles.navLink}>Liên hệ</a>
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
          <a href="#" className={`${styles.icon} ${styles.messageIcon}`}>
            <i className="fas fa-comment-dots"></i>
            <span className={styles.iconLabel}>Nhắn tin</span>
          </a>
          
          <button onClick={toggleMenu} className={styles.menuButton}>
            <div className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;