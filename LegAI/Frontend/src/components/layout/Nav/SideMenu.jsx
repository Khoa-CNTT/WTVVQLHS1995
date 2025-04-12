import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const SideMenu = ({ isOpen, onClose, currentUser, onLogout }) => {
  return (
    <>
      <div className={`${styles.sideMenu} ${isOpen ? styles.sideMenuOpen : ''}`}>
        <div className={styles.sideMenuHeader}>
          <h3>Menu</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {currentUser && (
          <div className={styles.sideMenuUser}>
            <div className={styles.sideMenuAvatar}>
              <span className={styles.sideMenuInitial}>
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className={styles.sideMenuUserInfo}>
              <span className={styles.sideMenuName}>{currentUser.fullName || currentUser.username}</span>
              <span className={styles.sideMenuEmail}>{currentUser.email}</span>
            </div>
          </div>
        )}
        
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
          
          {currentUser ? (
            <>
              {/* Kiểm tra vai trò admin */}
              {currentUser.role?.toLowerCase() === 'admin' && (
                <Link to="/dashboard" className={styles.sideMenuItem} onClick={onClose}>
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Quản trị hệ thống</span>
                </Link>
              )}
              
              {/* Kiểm tra vai trò luật sư */}
              {currentUser.role?.toLowerCase() === 'lawyer' && (
                <Link to="/lawyer-dashboard" className={styles.sideMenuItem} onClick={onClose}>
                  <i className="fas fa-gavel"></i>
                  <span>Bảng điều khiển luật sư</span>
                </Link>
              )}
              
              <Link to="/profile" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-user"></i>
                <span>Hồ sơ cá nhân</span>
              </Link>
              
              <span className={styles.sideMenuItem} onClick={() => { onLogout(); onClose(); }}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Đăng xuất</span>
              </span>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-sign-in-alt"></i>
                <span>Đăng nhập</span>
              </Link>
              
              <Link to="/register" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-user-plus"></i>
                <span>Đăng ký</span>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}
    </>
  );
};

export default SideMenu;