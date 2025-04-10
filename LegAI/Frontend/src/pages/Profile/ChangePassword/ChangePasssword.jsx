import React, { useState } from 'react';
import styles from './ChangePassword.module.css';
import { FaKey, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import userService from '../../../services/userService';

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Kiểm tra mật khẩu mới và xác nhận khớp nhau
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      setLoading(false);
      return;
    }

    try {
      // Lấy thông tin người dùng hiện tại
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError('Chưa đăng nhập. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      // Gọi API đổi mật khẩu
      await userService.changePassword(
        currentUser.id,
        currentPassword,
        newPassword
      );
      
      // Hiển thị thông báo thành công
      setSuccess('Đổi mật khẩu thành công!');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Chuyển hướng về trang hồ sơ sau 2 giây
      /* Commented out so we stay on the same page
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      */
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      setError(error.response?.data?.message || 'Mật khẩu hiện tại không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>ĐỔI MẬT KHẨU</h2>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <FaKey className={styles.icon} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className={styles.inputGroup}>
          <FaKey className={styles.icon} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className={styles.inputGroup}>
          <FaKey className={styles.icon} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className={styles.noteContainer}>
            <Link to="/forgot-password" className={styles.link}>
                Bạn đã quên mật khẩu hiện tại?
            </Link>
            <div className={styles.note}>
                Mật khẩu của bạn phải có tối thiểu 6 ký tự!
            </div>
        </div>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="fa-spin" /> Đang xử lý...
            </>
          ) : (
            'Xác nhận'
          )}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;