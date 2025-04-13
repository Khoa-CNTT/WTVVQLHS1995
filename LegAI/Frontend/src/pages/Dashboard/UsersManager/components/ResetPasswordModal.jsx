import React, { useState } from 'react';
import styles from '../UsersManagerPage.module.css';
import { toast } from 'react-toastify';

const ResetPasswordModal = ({ userId, onSave, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Styles inline
  const passwordInputWrapperStyle = {
    position: 'relative',
    width: '100%'
  };

  const togglePasswordStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px'
  };

  const passwordHintStyle = {
    display: 'block',
    marginTop: '5px',
    color: '#6c757d',
    fontSize: '0.85rem'
  };

  const generateButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    margin: '10px 0',
    transition: 'all 0.2s'
  };

  const errorAlertStyle = {
    padding: '10px 15px',
    marginBottom: '15px',
    borderRadius: '4px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem'
  };

  const modalStyle = {
    margin: '0 auto',
    maxHeight: '90vh',
    overflowY: 'auto',
    width: '100%',
    maxWidth: '450px'
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Đảm bảo ít nhất 6 ký tự
    for (let i = 0; i < 10; i++) {
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
    
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    toast.success('Đã đặt lại mật khẩu thành công');
    onSave(userId, newPassword);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-key"></i> Đặt lại mật khẩu
          </h2>
          <button className={styles.modalCloseButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div style={errorAlertStyle}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mật khẩu mới:</label>
            <div style={passwordInputWrapperStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.formInput}
                placeholder="Nhập mật khẩu mới"
              />
              <button 
                type="button" 
                style={togglePasswordStyle}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <small style={passwordHintStyle}>Mật khẩu phải có ít nhất 6 ký tự</small>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Xác nhận mật khẩu:</label>
            <div style={passwordInputWrapperStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.formInput}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={generateRandomPassword} 
            style={generateButtonStyle}
          >
            <i className="fas fa-random"></i> Tạo mật khẩu ngẫu nhiên
          </button>
          
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