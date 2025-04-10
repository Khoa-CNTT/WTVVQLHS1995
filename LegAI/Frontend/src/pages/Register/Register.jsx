import styles from './RegisterPage.module.css';
import { useState, useRef, useEffect } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey, FaPhone, FaIdCard } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [userId, setUserId] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 phút
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const otpInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();

  // Xử lý đếm ngược thời gian OTP
  useEffect(() => {
    let intervalId;
    if (isCountdownActive && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prevCount => prevCount - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }

    return () => clearInterval(intervalId);
  }, [isCountdownActive, countdown]);

  // Khởi động đếm ngược khi mở modal OTP
  useEffect(() => {
    if (showOTPModal) {
      setCountdown(900); // 15 phút
      setIsCountdownActive(true);
    }
  }, [showOTPModal]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Kiểm tra mật khẩu trùng khớp
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      setLoading(false);
      return;
    }

    try {
      // Đăng ký tài khoản sẽ trả về userId và gửi email OTP thông qua EmailJS
      const response = await authService.register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName
      });

      setUserId(response.data.userId);
      setShowOTPModal(true);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Chỉ cho phép nhập số và tối đa 6 ký tự
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtpValue(value);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.resendOTP(userId, formData.email);
      setCountdown(900); // 15 phút
      setIsCountdownActive(true);
      setOtpValue('');

      alert('Đã gửi lại mã OTP, vui lòng kiểm tra email');
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);

    if (otpValue.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số OTP');
      setLoading(false);
      return;
    }

    try {
      await authService.verifyAccount(userId, otpValue);
      setShowOTPModal(false);
      alert('Xác minh tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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

        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

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

          <button
            type="submit"
            className={styles.registerButton}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
      </div>

      {/* Modal xác minh OTP */}
      {showOTPModal && (
        <div className={styles.otpModal} onClick={(e) => e.target === e.currentTarget && setShowOTPModal(false)}>
          <div className={styles.otpContent}>
            <div className={styles.otpHeader}>
              <h3 className={styles.otpTitle}>Xác minh tài khoản</h3>
            </div>
            <div className={styles.otpBody}>
              <p className={styles.otpDescription}>
                Mã xác minh đã được gửi đến<br />
                <span className={styles.otpEmail}>{formData.email}</span>
              </p>

              {error && <p style={{ color: 'red', fontSize: '13px', textAlign: 'center', margin: '0 0 15px' }}>{error}</p>}

              <div className={styles.otpInputContainer}>
                  <input
                    type="text"
                    className={styles.otpInput}
                  value={otpValue}
                  onChange={handleOtpChange}
                  placeholder="Nhập mã OTP 6 chữ số"
                  maxLength={6}
                  autoFocus
                  />
              </div>

              <div className={styles.otpButtonContainer}>
                <button
                  className={styles.otpVerifyButton}
                  onClick={handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? 'Đang xác minh...' : 'Xác minh'}
                </button>
              </div>

              <div className={styles.otpResendContainer}>
                <span className={styles.otpResendText}>Không nhận được mã?</span>
                <button
                  className={styles.otpResendButton}
                  onClick={handleResendOTP}
                  disabled={loading || isCountdownActive}
                >
                  {isCountdownActive ? `Gửi lại sau (${formatTime(countdown)})` : 'Gửi lại mã'}
                </button>
              </div>

              <div className={styles.timer}>
                Mã OTP có hiệu lực trong <span className={styles.timerHighlight}>{formatTime(countdown)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;