import React, { useState } from 'react';
import styles from '../UsersManagerPage.module.css';

const ResetPasswordModal = ({ userId, onSave, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    // Gửi yêu cầu đặt lại mật khẩu
    onSave(userId, newPassword);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-key"></i> Đặt Lại Mật Khẩu
          </h2>
          <button className={styles.modalCloseButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mật khẩu mới:</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu mới"
                className={styles.formInput}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
            <small className={styles.formHelp}>Mật khẩu phải có ít nhất 8 ký tự</small>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Xác nhận mật khẩu:</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Nhập lại mật khẩu mới"
              className={styles.formInput}
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.formGroup}>
            <button
              type="button"
              className={styles.generateButton}
              onClick={generateRandomPassword}
            >
              <i className="fas fa-random"></i> Tạo mật khẩu ngẫu nhiên
            </button>
          </div>
          
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              <i className="fas fa-save"></i> Lưu thay đổi
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              <i className="fas fa-times"></i> Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal; 