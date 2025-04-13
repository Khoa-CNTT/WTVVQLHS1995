import styles from './LoginPage.module.css';
import { useState, useEffect } from 'react';
import { FaFacebookF, FaEnvelope, FaXTwitter, FaUser, FaKey } from 'react-icons/fa6';
import { FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { sendOTPEmail } from '../../services/emailService';
import Loading from '../../components/layout/Loading/Loading';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requireOTP, setRequireOTP] = useState(false);
  const [userIdToVerify, setUserIdToVerify] = useState(null);
  const [emailToVerify, setEmailToVerify] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otp, setOtp] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Kiểm tra thông báo từ các trang khác chuyển đến
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Xóa state để tránh hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const goToHomePage = () => {
    navigate('/');
  };
  
  const goToRegisterPage = () => {
    navigate('/register');
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Kiểm tra form
    if (!usernameOrEmail || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    
    try {
      setLoading(true);
      
      // Gọi API đăng nhập
      await authService.login(usernameOrEmail, password);
      
      // Nếu đăng nhập thành công, chuyển hướng đến trang chính
      navigate('/');
      
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      
      // Xử lý lỗi tài khoản chưa được xác minh
      if (error.needVerification && error.userId) {
        // Thay đổi trạng thái để hiển thị form nhập OTP
        setRequireOTP(true);
        setUserIdToVerify(error.userId);
        setEmailToVerify(error.email);
        setError('');
        
        // Hiển thị thông báo cho người dùng biết đã gửi OTP
        setOtpMessage(`Tài khoản chưa được xác minh. Mã OTP đã được gửi đến email ${error.email}. Vui lòng kiểm tra email và nhập mã OTP để xác minh.`);
      } 
      // Xử lý lỗi tài khoản bị khóa
      else if (error.isLocked) {
        setError('Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
      } 
      // Các lỗi khác
      else {
        setError(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
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
    
    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    
    try {
      setLoading(true);
      
      // Gửi yêu cầu xác minh OTP
      await authService.verifyAccount(userIdToVerify, otp);
      
      // Hiển thị thông báo thành công
      setSuccessMessage('Xác minh tài khoản thành công! Đang chuyển hướng...');
      
      // Đợi 2 giây và thử đăng nhập lại
      setTimeout(async () => {
        try {
          // Đăng nhập lại sau khi xác minh thành công
          await authService.login(usernameOrEmail, password);
          navigate('/');
        } catch (loginError) {
          console.error('Lỗi đăng nhập sau khi xác minh:', loginError);
          setError('Xác minh thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại.');
          setRequireOTP(false); // Quay lại form đăng nhập
        } finally {
          setLoading(false);
        }
      }, 2000);
      
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
        
        {requireOTP ? (
          // Form nhập OTP
          <>
            <h2 className={styles.title}>Xác minh tài khoản</h2>
            <p className={styles.otpMessage}>
              {otpMessage || `Vui lòng nhập mã OTP đã được gửi đến email ${emailToVerify} để xác minh tài khoản`}
            </p>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
            
            <form onSubmit={handleVerifyOTP}>
              <div className={styles.inputGroup}>
                <FaKey className={styles.icon} />
                <input 
                  type="text" 
                  placeholder="Nhập mã OTP 6 chữ số" 
                  value={otp}
                  onChange={(e) => {
                    // Chỉ chấp nhận số và giới hạn 6 ký tự
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) {
                      setOtp(val);
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
                  onClick={() => handleSendOTP(userIdToVerify, emailToVerify)}
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
            
            <div className={styles.bottomRow}>
              <button 
                className={styles.backButton}
                onClick={() => {
                  setRequireOTP(false);
                  setError('');
                  setSuccessMessage('');
                }}
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
            
            {successMessage && (
              <div className={styles.successMessage}>{successMessage}</div>
            )}
            
            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <FaUser className={styles.icon} />
                <input 
                  type="text" 
                  placeholder="Tên đăng nhập hoặc Email" 
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
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
                <a href="/forgot-password">Quên mật khẩu?</a>
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
