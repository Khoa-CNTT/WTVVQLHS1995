import styles from './../Login/LoginPage.module.css';
import { useState } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey } from 'react-icons/fa6';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.loginSection}>
        <div className={styles.logo}>Vietnamese<br />Law</div>
        <h2 className={styles.title}>Đăng nhập vào tài khoản của bạn</h2>

        <div className={styles.socialLogin}>
          <button><FaFacebookF /></button>
          <button><FaEnvelope /></button>
          <button><FaXTwitter /></button>
        </div>

        <div className={styles.orDivider}>
          <span>OR</span>
        </div>

        <div className={styles.inputGroup}>
          <FaUser className={styles.icon} />
          <input type="text" placeholder="Nhập email hoặc số điện thoại ..." />
        </div>

        <div className={styles.inputGroup}>
          <FaKey className={styles.icon} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu ..."
          />
          <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className={styles.bottomRow}>
          <a href="#">Quên mật khẩu?</a>
        </div>

        <button className={styles.loginButton}>Đăng nhập</button>
      </div>

      <div className={styles.registerSection}>
        <h2 className={styles.greeting}>CHÀO BẠN MỚI</h2>
        <p>Đăng kí và nhận thêm nhiều cơ hội trải nghiệm mới ở đây</p>
        <button className={styles.registerButton}>Đăng kí</button>
      </div>
    </div>
  );
}

export default LoginPage;
