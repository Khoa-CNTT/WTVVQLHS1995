import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEye, FaEyeSlash, FaKey, FaFileAlt, FaUserCircle, FaPen, FaUpload, FaCalendarAlt, FaHistory, FaBalanceScale } from 'react-icons/fa';
import styles from './Profile.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { useProfile } from '../../components/hooks/Profile';
import ChangePasswordPage from './ChangePassword/ChangePasssword';

function Profile() {
  const navigate = useNavigate();
  const {
    user,
    userDetails,
    formData,
    loading,
    error,
    successMessage,
    setFormData,
    setError,
    setSuccessMessage,
    fetchUserProfile,
    updateUserProfile,
    uploadAvatar,
    formatDate
  } = useProfile();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/default-avatar.png');
  const [avatar, setAvatar] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Kiểm tra đăng nhập
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Lấy thông tin chi tiết người dùng
    fetchUserProfile(currentUser.id);
  }, [navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    setError('');
    setSuccessMessage('');
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      // Tạo URL preview
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      // Cập nhật thông tin hồ sơ
      await updateUserProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio
      });
      
      // Nếu có avatar mới, tải lên
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        await uploadAvatar(formData);
      }
      
      setEditMode(false);
    } catch (error) {
      // Lỗi đã được xử lý trong hook
    }
  };
  
  // Xác thực mật khẩu mới
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return requirements;
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError('');
    setSuccessMessage('');
    
    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setPasswordLoading(false);
      return;
    }
    
    // Kiểm tra độ dài mật khẩu và các yêu cầu khác
    const passwordCheck = validatePassword(passwordData.newPassword);
    if (!passwordCheck.length) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      setPasswordLoading(false);
      return;
    }
    
    try {
      await userService.changePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setSuccessMessage('Đổi mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Mật khẩu hiện tại không chính xác');
      setPasswordLoading(false);
    }
  };
  
  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }
  
  if (!user) {
    return <div className={styles.error}>Không thể tải thông tin người dùng</div>;
  }

  // Kiểm tra yêu cầu mật khẩu
  const passwordRequirements = validatePassword(passwordData.newPassword);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  return (
    <>
      <Navbar />
      <div className={styles.profileContainer}>
        
        <div className={styles.content}>
          <div className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatarWrapper}>
                <img 
                  src={previewUrl || user.avatarUrl || '/default-avatar.png'} 
                  alt="Ảnh đại diện" 
                  className={styles.avatar}
                />
                {editMode && (
                  <label className={styles.uploadButton}>
                    <FaUpload />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              <h2>{user.fullName || user.username}</h2>
              <div className={styles.userRole}>
                <FaBalanceScale />
                <span>{user.role || 'Người dùng'}</span>
              </div>
              
              <div className={styles.userStats}>
                <div className={styles.statItem}>
                  <FaCalendarAlt />
                  <div>
                    <p>Tham gia:</p>
                    <span>{formatDate(userDetails.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <FaHistory />
                  <div>
                    <p>Đăng nhập gần đây:</p>
                    <span>{formatDate(userDetails.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.menuItems}>
              <button 
                className={`${styles.menuItem} ${activeTab === 'profile' ? styles.active : ''}`} 
                onClick={() => setActiveTab('profile')}
              >
                <FaUser /> Thông tin cá nhân
              </button>
              <button 
                className={`${styles.menuItem} ${activeTab === 'password' ? styles.active : ''}`} 
                onClick={() => setActiveTab('password')}
              >
                <FaKey /> Đổi mật khẩu
              </button>
              <button 
                className={`${styles.menuItem} ${activeTab === 'activity' ? styles.active : ''}`} 
                onClick={() => setActiveTab('activity')}
              >
                <FaFileAlt /> Hoạt động
              </button>
            </div>
          </div>
          
          <div className={styles.mainContent}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
            
            {activeTab === 'profile' && (
              <div className={styles.profileTab}>
                <div className={styles.sectionHeader}>
                  <h2>Thông tin cá nhân</h2>
                  {!editMode ? (
                    <button 
                      className={styles.editButton} 
                      onClick={() => setEditMode(true)}
                    >
                      <FaPen /> Chỉnh sửa
                    </button>
                  ) : null}
                </div>
                
                {!editMode ? (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <FaUser className={styles.infoIcon} />
                      <div>
                        <h3>Tên người dùng</h3>
                        <p>{user.username}</p>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <FaEnvelope className={styles.infoIcon} />
                      <div>
                        <h3>Email</h3>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <FaUser className={styles.infoIcon} />
                      <div>
                        <h3>Họ và tên</h3>
                        <p>{formData.fullName || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <FaPhone className={styles.infoIcon} />
                      <div>
                        <h3>Số điện thoại</h3>
                        <p>{formData.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <FaMapMarkerAlt className={styles.infoIcon} />
                      <div>
                        <h3>Địa chỉ</h3>
                        <p>{formData.address || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem + ' ' + styles.fullWidth}>
                      <div className={styles.bioSection}>
                        <h3>Giới thiệu</h3>
                        <p>{formData.bio || 'Chưa cập nhật thông tin giới thiệu.'}</p>
                      </div>
                    </div>
                    
                    {userDetails.isLawyer && userDetails.lawyerDetails && (
                      <>
                        <div className={styles.infoItem}>
                          <div>
                            <h3>Chứng chỉ</h3>
                            <p>{userDetails.lawyerDetails.certification || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                        
                        <div className={styles.infoItem}>
                          <div>
                            <h3>Kinh nghiệm</h3>
                            <p>{userDetails.lawyerDetails.experienceYears || 0} năm</p>
                          </div>
                        </div>
                        
                        <div className={styles.infoItem}>
                          <div>
                            <h3>Lĩnh vực</h3>
                            <p>{userDetails.lawyerDetails.specialization || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                        
                        <div className={styles.infoItem}>
                          <div>
                            <h3>Đánh giá</h3>
                            <p>{userDetails.lawyerDetails.rating || 0}/5</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <form className={styles.editForm} onSubmit={handleUpdateProfile}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Họ và tên</label>
                        <input 
                          type="text" 
                          name="fullName" 
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Số điện thoại</label>
                        <input 
                          type="text" 
                          name="phone" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Địa chỉ</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Nhập địa chỉ"
                        />
                      </div>
                      
                      <div className={styles.formGroup + ' ' + styles.fullWidth}>
                        <label>Giới thiệu</label>
                        <textarea 
                          name="bio" 
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Nhập thông tin giới thiệu về bạn"
                          rows={5}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className={styles.formButtons}>
                      <button 
                        type="button" 
                        className={styles.cancelButton} 
                        onClick={() => setEditMode(false)}
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            
            {activeTab === 'password' && (
              <div className={styles.passwordTab}>
                <div className={styles.sectionHeader}>
                </div>
                <ChangePasswordPage />
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className={styles.activityTab}>
                <div className={styles.sectionHeader}>
                  <h2>Hoạt động gần đây</h2>
                </div>
                
                <div className={styles.statsCards}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaFileAlt />
                    </div>
                    <div className={styles.statValue}>{userDetails.stats?.documents || 0}</div>
                    <div className={styles.statLabel}>Tài liệu</div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaBalanceScale />
                    </div>
                    <div className={styles.statValue}>{userDetails.stats?.cases || 0}</div>
                    <div className={styles.statLabel}>Vụ án</div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaCalendarAlt />
                    </div>
                    <div className={styles.statValue}>{userDetails.stats?.appointments || 0}</div>
                    <div className={styles.statLabel}>Cuộc hẹn</div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                      <FaUserCircle />
                    </div>
                    <div className={styles.statValue}>{userDetails.stats?.consultations || 0}</div>
                    <div className={styles.statLabel}>Tư vấn</div>
                  </div>
                </div>
                
                <div className={styles.activityLinks}>
                  <a href="#" className={styles.activityLink}>
                    <FaFileAlt /> Xem tài liệu của tôi
                  </a>
                  <a href="#" className={styles.activityLink}>
                    <FaBalanceScale /> Xem vụ án của tôi
                  </a>
                  <a href="#" className={styles.activityLink}>
                    <FaCalendarAlt /> Quản lý cuộc hẹn
                  </a>
                  <a href="#" className={styles.activityLink}>
                    <FaUserCircle /> Lịch sử tư vấn
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;