import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import userService from '../../../services/userService';

const SideMenu = ({ isOpen, onClose, currentUser: initialUser, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const navigate = useNavigate();

  // Làm mới thông tin người dùng khi mở menu
  useEffect(() => {
    if (isOpen && initialUser) {
      // Nên sử dụng một bản sao để tránh hiệu ứng nhấp nháy
      setCurrentUser(initialUser);

      // Làm mới thông tin người dùng từ server
      userService.refreshUserData()
        .then(updatedUser => {
          setCurrentUser(updatedUser);
        })
        .catch(error => {
          console.error('Lỗi làm mới thông tin người dùng:', error);
        });
    }
  }, [isOpen, initialUser]);

  // Hàm xử lý điều hướng khi tài khoản đã là luật sư
  const handleLawyerDashboard = () => {
    onClose();
    navigate('/lawyer-dashboard');
  };

  // Kiểm tra vai trò chính xác
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isLawyer = currentUser?.role?.toLowerCase() === 'lawyer';
  const isUser = currentUser?.role?.toLowerCase() === 'user' || (!isAdmin && !isLawyer);

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
              {currentUser.avatarUrl ? (
                <img
                  src={userService.getFullAvatarUrl(currentUser.avatarUrl)}
                  alt={currentUser.fullName || 'User'}
                  className={styles.sideMenuAvatarImg}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              ) : (
                <span className={styles.sideMenuInitial}>
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div className={styles.sideMenuUserInfo}>
              <span className={styles.sideMenuName}>{currentUser.fullName || currentUser.username}</span>
              <span className={styles.sideMenuEmail}>{currentUser.email}</span>
              <span className={styles.sideMenuRole}>{currentUser.role || 'Người dùng'}</span>
            </div>
          </div>
        )}

        <div className={styles.sideMenuContent}>
          <Link to="/" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-home"></i> Trang chủ
          </Link>

          {currentUser && (
            <>
              <Link to="/legal-docs" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-file-contract"></i> Hồ sơ pháp lý cá nhân
              </Link>
              <Link to="/contracts" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-file-alt"></i> Hợp đồng cá nhân
              </Link>
              <Link to="/legal-cases" className={styles.sideMenuItem} onClick={onClose}>
                <i className="fas fa-file-alt"></i> Xử lý vụ án
              </Link>
            </>
          )}

          <Link to="/lawyers" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-user-tie"></i> Luật sư
          </Link>

          <Link to="/documents" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-file-alt"></i> Xem tất cả văn bản
          </Link>
          <Link to="/templates" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-file-alt"></i> Xem tất cả mẫu
          </Link>

          <Link to="/news" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-newspaper"></i> Tin tức
          </Link>

          <Link to="/contact" className={styles.sideMenuItem} onClick={onClose}>
            <i className="fas fa-envelope"></i> Liên hệ
          </Link>

          <div className={styles.sideMenuDivider}></div>

          {currentUser ? (
            <>
              {/* Kiểm tra vai trò admin */}
              {isAdmin && (
                <Link to="/dashboard" className={styles.sideMenuItem} onClick={onClose}>
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Quản trị hệ thống</span>
                </Link>
              )}

              {/* Kiểm tra vai trò luật sư */}
              {isLawyer && (
                <Link to="/lawyer-dashboard" className={styles.sideMenuItem} onClick={onClose}>
                  <i className="fas fa-gavel"></i>
                  <span>Bảng điều khiển luật sư</span>
                </Link>
              )}

              {/* Hiển thị tùy chọn đăng ký làm luật sư cho người dùng thông thường */}
              {isUser && (
                <Link to="/lawyers/signup" className={styles.sideMenuItem} onClick={onClose}>
                  <i className="fas fa-gavel"></i>
                  <span>Đăng ký làm luật sư</span>
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