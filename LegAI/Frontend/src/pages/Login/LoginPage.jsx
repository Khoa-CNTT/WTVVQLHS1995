import styles from './LoginPage.module.css';
import { useState } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const fakeUsers = [
  {
    id: 1,
    userName: 'Hahaha',
    password: '123456',
    name: 'Nguyễn Văn A'
  },
  {
    id: 2,
    userName: 'admin@legai.com',
    password: 'admin123',
    name: 'Admin'
  }
];

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setuserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const goToHomePage = () => {
    navigate('/');
  };
  const goToRegisterPage = () => {
    navigate('/register');
  };
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = fakeUsers.find(
      (user) => user.userName === userName && user.password === password
    );

    if (foundUser) {
      alert(`Đăng nhập thành công. Xin chào ${foundUser.name}!`);
      navigate('/dashboard'); // hoặc trang chính khác
    } else {
      alert('Sai Tên đăng nhập hoặc mật khẩu.');
    }
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
          <button title="Đăng nhập bằng userName"><FaEnvelope /></button>
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
              placeholder="Tên đăng nhập" 
              value={userName}
              onChange={(e) => setuserName(e.target.value)}
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
        <button className={styles.registerButton} onClick={goToRegisterPage}>Đăng ký ngay</button>
      </div>
    </div>
  );
}

export default LoginPage;
