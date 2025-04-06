import styles from './RegisterPage.module.css';
import { useState } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey, FaPhone, FaIdCard } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const goToHomePage = () => {
    navigate('/');
  };

  const goToLoginPage = () => {
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    // Kiểm tra mật khẩu trùng khớp
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    // Thực hiện xử lý đăng ký tại đây
    console.log('Đăng ký với:', formData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.registerSection}>
        <FaBalanceScale size={40} style={{ marginBottom: '15px', opacity: '0.8' }} />
        <h2 className={styles.greeting}>PHÁP LUẬT VIỆT NAM</h2>
        <p>Đã có tài khoản? Đăng nhập ngay.</p>
        <button className={styles.loginButton} onClick={goToLoginPage}>Đăng nhập</button>
      </div>

      <div className={styles.signupSection}>
        <div className={styles.logo} onClick={goToHomePage}>
          <FaGavel style={{ marginRight: '10px', color: 'Gray' }} />
          <span>LegAI</span>
        </div>
        <h2 className={styles.title}>Tạo tài khoản mới</h2>

        <div className={styles.socialLogin}>
          <button title="Đăng ký bằng Facebook"><FaFacebookF /></button>
          <button title="Đăng ký bằng Email"><FaEnvelope /></button>
          <button title="Đăng ký bằng Twitter"><FaXTwitter /></button>
        </div>

        <div className={styles.orDivider}>
          <span>hoặc</span>
        </div>

        <form onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <FaIdCard className={styles.icon} />
            <input 
              type="text" 
              name="fullName"
              placeholder="Họ và tên" 
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <FaUser className={styles.icon} />
            <input 
              type="text" 
              name="username"
              placeholder="Tên đăng nhập" 
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <FaEnvelope className={styles.icon} />
            <input 
              type="email" 
              name="email"
              placeholder="Email" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <FaPhone className={styles.icon} />
            <input 
              type="tel" 
              name="phone"
              placeholder="Số điện thoại" 
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <FaKey className={styles.icon} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className={styles.inputGroup}>
            <FaKey className={styles.icon} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span className={styles.eye} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className={styles.terms}>
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">Tôi đồng ý với <a href="#">Điều khoản</a> và <a href="#">Chính sách</a></label>
          </div>

          <button type="submit" className={styles.registerButton}>Đăng ký</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;