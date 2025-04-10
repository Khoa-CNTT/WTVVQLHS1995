import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaKey, FaEnvelope, FaEye, FaEyeSlash, FaGavel, FaBalanceScale } from 'react-icons/fa';
import styles from './ForgotPassword.module.css';
import Loading from '../../components/layout/Loading/Loading';
import authService from '../../services/authService';
import { sendOTPEmail } from '../../services/emailService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP, 3: Đặt mật khẩu mới
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  
  const goToHomePage = () => {
    navigate('/');
  };
  
  const goToLoginPage = () => {
    navigate('/login');
  };
  
  // Xử lý kiểm tra email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Sử dụng API thực tế để gửi yêu cầu đặt lại mật khẩu
      const response = await authService.requestPasswordReset(email);
      
      if (response && response.status === 'success') {
        // Lưu thông tin từ response
        setUserId(response.userId);
        setUserEmail(response.email);
        
        // Gửi OTP qua email dùng EmailJS
        if (response.otp) {
          try {
            await sendOTPEmail(response.email, "Người dùng", response.otp);
            setStep(2);
          } catch (emailError) {
            setError('Có lỗi khi gửi email OTP: ' + emailError.message);
          }
        } else {
          setError('Không nhận được mã OTP từ server');
        }
      } else {
        setError('Có lỗi xảy ra khi xử lý yêu cầu');
      }
      
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi kiểm tra email');
      setLoading(false);
    }
  };
  
  // Xử lý xác minh OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Xác minh OTP thông qua API
      await authService.verifyResetToken(userId, otp);
      
      // Nếu thành công, chuyển sang bước 3
      setStep(3);
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Mã OTP không đúng hoặc đã hết hạn');
      setLoading(false);
    }
  };
  
  // Xử lý đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    // Kiểm tra mật khẩu phải khớp nhau
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    
    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    
    try {
      // Đặt lại mật khẩu thông qua API
      await authService.resetPassword(userId, password);
      
      setLoading(false);
      // Chuyển hướng về trang đăng nhập
      navigate('/login', { 
        state: { 
          message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' 
        } 
      });
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      setLoading(false);
    }
  };
  
  // Xử lý gửi lại OTP
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Gửi lại yêu cầu đặt lại mật khẩu để nhận OTP mới
      const response = await authService.requestPasswordReset(userEmail);
      
      // Gửi OTP qua email dùng EmailJS
      if (response && response.status === 'success' && response.otp) {
        await sendOTPEmail(userEmail, "Người dùng", response.otp);
        setError({ type: 'success', message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email của bạn.' });
      } else {
        setError('Không nhận được mã OTP từ server');
      }
      
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Không thể gửi lại mã OTP');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.forgotPasswordSection}>
        <div className={styles.logo} onClick={goToHomePage}>
          <FaGavel style={{ marginRight: '10px', color: 'Gray' }} />
          <span>LegAI</span>
        </div>
        
        {step === 1 && (
          <>
            <h2 className={styles.title}>Quên mật khẩu</h2>
            <p className={styles.subtitle}>Vui lòng nhập email đã đăng ký để nhận mã xác nhận</p>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <form onSubmit={handleEmailSubmit}>
              <div className={styles.inputGroup}>
                <FaEnvelope className={styles.icon} />
                <input 
                  type="email" 
                  placeholder="Nhập email của bạn" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className={styles.resetButton}>Gửi mã xác nhận</button>
            </form>
            
            <div className={styles.bottomRow}>
              <button type="button" className={styles.backButton} onClick={goToLoginPage}>
                Quay lại đăng nhập
              </button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <h2 className={styles.title}>Xác nhận mã OTP</h2>
            <p className={styles.subtitle}>
              Nhập mã OTP đã được gửi đến email <span className={styles.emailHighlight}>{userEmail}</span>
            </p>
            
            {error && typeof error === 'object' && error.type === 'success' ? (
              <div className={styles.successMessage}>{error.message}</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : null}
            
            <form onSubmit={handleOtpSubmit}>
              <div className={styles.inputGroup}>
                <FaKey className={styles.icon} />
                <input 
                  type="text" 
                  placeholder="Nhập mã OTP 6 chữ số" 
                  value={otp}
                  onChange={(e) => {
                    // Chỉ cho phép nhập số và giới hạn 6 ký tự
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  className={styles.otpInput}
                  maxLength={6}
                  required
                />
              </div>
              
              <button type="submit" className={styles.resetButton}>Xác nhận</button>
            </form>
            
            <div className={styles.bottomRow}>
              <button 
                type="button" 
                className={styles.resendButton}
                onClick={handleResendOTP}
              >
                Gửi lại mã OTP
              </button>
            </div>
            
            <div className={styles.bottomRow}>
              <button type="button" className={styles.backButton} onClick={() => setStep(1)}>
                Quay lại
              </button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <>
            <h2 className={styles.title}>Đặt lại mật khẩu</h2>
            <p className={styles.subtitle}>Tạo mật khẩu mới cho tài khoản của bạn</p>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <form onSubmit={handleResetPassword}>
              <div className={styles.inputGroup}>
                <FaKey className={styles.icon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              
              <div className={styles.inputGroup}>
                <FaKey className={styles.icon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span className={styles.eye} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              
              <div className={styles.passwordRequirements}>
                <p>Mật khẩu của bạn phải có tối thiểu 6 ký tự, đồng thời bao gồm cả chữ và số.</p>
              </div>
              
              <button type="submit" className={styles.resetButton}>Đặt lại mật khẩu</button>
            </form>
            
            <div className={styles.bottomRow}>
              <button type="button" className={styles.backButton} onClick={() => setStep(2)}>
                Quay lại
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className={styles.registerSection}>
        <FaBalanceScale size={50} style={{ marginBottom: '20px', opacity: '0.8' }} />
        <h2 className={styles.greeting}>PHÁP LUẬT VIỆT NAM</h2>
        <p>Đăng ký tài khoản để truy cập vào hệ thống quản lý pháp lý toàn diện và tận dụng các công cụ hỗ trợ pháp lý tiên tiến.</p>
        <button className={styles.registerButton} onClick={() => navigate('/register')}>Đăng ký ngay</button>
      </div>
    </div>
  );
}

export default ForgotPassword; 