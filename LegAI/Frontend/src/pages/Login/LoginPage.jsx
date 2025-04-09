import styles from './LoginPage.module.css';
import { useState } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { sendOTPEmail } from '../../services/emailService';
import Loading from '../../components/layout/Loading/Loading';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  const navigate = useNavigate();
  
  const goToHomePage = () => {
    navigate('/');
  };
  
  const goToRegisterPage = () => {
    navigate('/register');
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login(username, password);
      // Đăng nhập thành công
      setLoading(false);
      navigate('/');
    } catch (error) {
      setLoading(false);
      console.error('Lỗi đăng nhập:', error);
      
      // Kiểm tra trường hợp chưa xác minh tài khoản
      if (error.message && error.message.includes('chưa được xác minh')) {
        // Lưu thông tin user để gửi OTP
        if (error.userId && error.email) {
          setUserId(error.userId);
          setUserEmail(error.email);
          setShowOtpForm(true);
          handleSendOTP(error.userId, error.email);
        } else {
          setError('Không thể xác minh tài khoản. Vui lòng liên hệ hỗ trợ.');
        }
      } else {
        setError(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };
  
  const handleSendOTP = async (userIdToUse, emailToUse) => {
    setLoading(true);
    try {
      // Gửi lại OTP
      const id = userIdToUse || userId;
      const email = emailToUse || userEmail;
      await authService.resendOTP(id, email);
      setLoading(false);
    } catch (error) {
      setError('Không thể gửi mã OTP. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.verifyAccount(userId, otpValue);
      setLoading(false);
      // Sau khi xác minh thành công, cho phép đăng nhập lại
      setShowOtpForm(false);
      setError('Xác minh tài khoản thành công. Vui lòng đăng nhập lại.');
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Xác minh thất bại. Vui lòng kiểm tra lại mã OTP.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginSection}>
        <div className={styles.logo} onClick={goToHomePage}>
          <FaGavel style={{ marginRight: '10px',color: 'Gray' }} />
          <span>LegAI</span>
        </div>
        
        {showOtpForm ? (
          // Form nhập OTP
          <>
            <h2 className={styles.title}>Xác minh tài khoản</h2>
            <p className={styles.otpMessage}>
              Vui lòng nhập mã OTP đã được gửi đến email của bạn để xác minh tài khoản
            </p>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <form onSubmit={handleVerifyOTP}>
              <div className={styles.inputGroup}>
                <FaKey className={styles.icon} />
                <input 
                  type="text" 
                  placeholder="Nhập mã OTP 6 chữ số" 
                  value={otpValue}
                  onChange={(e) => {
                    // Chỉ chấp nhận số và giới hạn 6 ký tự
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) {
                      setOtpValue(val);
                    }
                  }}
                  maxLength={6}
                  required
                />
              </div>
              
              <button type="submit" className={styles.loginButton}>Xác minh</button>
              
              <div className={styles.bottomRow}>
                <button 
                  type="button" 
                  className={styles.resendButton}
                  onClick={() => handleSendOTP()}
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
            
            <div className={styles.bottomRow}>
              <button 
                className={styles.backButton}
                onClick={() => setShowOtpForm(false)}
              >
                Quay lại đăng nhập
              </button>
            </div>
          </>
        ) : (
          // Form đăng nhập
          <>
            <h2 className={styles.title}>Đăng nhập vào tài khoản của bạn</h2>
            
            <div className={styles.socialLogin}>
              <button title="Đăng nhập bằng Facebook"><FaFacebookF /></button>
              <button title="Đăng nhập bằng Email"><FaEnvelope /></button>
              <button title="Đăng nhập bằng Twitter"><FaXTwitter /></button>
            </div>

            <div className={styles.orDivider}>
              <span>hoặc</span>
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <FaUser className={styles.icon} />
                <input 
                  type="text" 
                  placeholder="Tên đăng nhập" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
          </>
        )}
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
