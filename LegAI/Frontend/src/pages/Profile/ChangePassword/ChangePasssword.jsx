import React, { useState } from 'react';
import styles from './ChangePassword.module.css';
import { FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom'; //hỏi chỗ này 


function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  
  const handleSubmit = (e) => {
    e.preventDefault(); 
    let fetchPasswordData = "phong123"
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận không khớp.');
      return;
    }

    alert('Đổi mật khẩu thành công!');
  };

  return (
    <div className={styles.container}>
      <h2>ĐỔI MẬT KHẨU</h2>
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
                Mật khẩu của bạn phải có tối thiểu 6 ký tự, đồng thời bao gồm cả chữ và số, chữ cái và ký tự đặc biệt.
             </div>
        </div>
        <button type="submit" className={styles.submitButton}>Xác nhận</button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;