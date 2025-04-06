import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const SideMenu = ({ isOpen, onClose }) => {
  return (
    <>
      <div className={`${styles.sideMenu} ${isOpen ? styles.sideMenuOpen : ''}`}>
        <div className={styles.sideMenuHeader}>
          <h3>Menu</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.sideMenuContent}>
          <Link to="/" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-home"></i>
            <span>Trang chủ</span>
          </Link>
          
          <Link to="/services" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-scale-balanced"></i>
            <span>Dịch vụ</span>
          </Link>
          
          <Link to="/lawyers" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-user-tie"></i>
            <span>Luật sư</span>
          </Link>
          
          <Link to="/news" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-newspaper"></i>
            <span>Tin tức</span>
          </Link>
          
          <Link to="/contact" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-envelope"></i>
            <span>Liên hệ</span>
          </Link>
          
          <div className={styles.sideMenuDivider}></div>
          
          <Link to="/login" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-sign-in-alt"></i>
            <span>Đăng nhập</span>
          </Link>
          
          <Link to="/register" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-user-plus"></i>
            <span>Đăng ký</span>
          </Link>
        </div>
      </div>
      
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}
    </>
  );
};

export default SideMenu;