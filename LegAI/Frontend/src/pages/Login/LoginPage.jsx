import styles from './LoginPage.module.css';
import { useState } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const goToHomePage = () => {
    navigate('/');
  };
  const handleLogin = (e) => {
    e.preventDefault();
    // Thực hiện xử lý đăng nhập tại đây
    console.log('Đăng nhập với:', email, password);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginSection}>
        <div className={styles.logo} onClick={goToHomePage}>
          <FaGavel style={{ marginRight: '10px',color: 'Gray' }} />
          <span>LegAI</span>
        </div>
        <h2 className={styles.title}>Đăng nhập vào tài khoản của bạn</h2>

        <div className={styles.socialLogin}>
          <button title="Đăng nhập bằng Facebook"><FaFacebookF /></button>
          <button title="Đăng nhập bằng Email"><FaEnvelope /></button>
          <button title="Đăng nhập bằng Twitter"><FaXTwitter /></button>
        </div>

        <div className={styles.orDivider}>
          <span>hoặc</span>
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <FaUser className={styles.icon} />
            <input 
              type="text" 
              placeholder="Email hoặc số điện thoại" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <FaKey className={styles.icon} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className={styles.bottomRow}>
            <a href="#">Quên mật khẩu?</a>
          </div>

          <button type="submit" className={styles.loginButton}>Đăng nhập</button>
        </form>
      </div>

      <div className={styles.registerSection}>
        <FaBalanceScale size={50} style={{ marginBottom: '20px', opacity: '0.8' }} />
        <h2 className={styles.greeting}>PHÁP LUẬT VIỆT NAM</h2>
        <p>Đăng ký tài khoản để truy cập vào hệ thống quản lý pháp lý toàn diện và tận dụng các công cụ hỗ trợ pháp lý tiên tiến.</p>
        <button className={styles.registerButton}>Đăng ký ngay</button>
      </div>
    </div>
  );
}

export default LoginPage;
