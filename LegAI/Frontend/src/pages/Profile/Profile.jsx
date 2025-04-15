import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEye, FaEyeSlash, FaKey, FaFileAlt, FaUserCircle, FaPen, FaUpload, FaCalendarAlt, FaHistory, FaBalanceScale } from 'react-icons/fa';
import styles from './Profile.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';
import userService from '../../services/userService';
import ChangePasswordPage from './ChangePassword/ChangePasssword';
import ChatManager from '../../components/layout/Chat/ChatManager';
import AppointmentsPage from './Appointments/AppointmentsPage';
import AppointmentsManager from '../../pages/LawyerDashboard/components/AppointmentsManager';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });
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
    
    // Làm mới thông tin người dùng từ server mỗi khi mở profile
    const refreshData = async () => {
      try {
        // Làm mới thông tin từ localStorage
        const updatedUser = await userService.refreshUserData();
        setUser(updatedUser);
        
        // Nếu có avatarUrl trong user, hiển thị ngay
        if (updatedUser && updatedUser.avatarUrl) {
          // Chuyển đổi đường dẫn tương đối thành đường dẫn đầy đủ
          const fullAvatarUrl = userService.getFullAvatarUrl(updatedUser.avatarUrl);
          setPreviewUrl(fullAvatarUrl);
        }
        
        // Sau đó lấy thông tin chi tiết
        fetchUserProfile(updatedUser.id);
      } catch (error) {
        console.error('Lỗi làm mới thông tin người dùng:', error);
        setUser(currentUser);
        
        // Nếu có avatarUrl trong currentUser, hiển thị ngay
        if (currentUser && currentUser.avatarUrl) {
          const fullAvatarUrl = userService.getFullAvatarUrl(currentUser.avatarUrl);
          setPreviewUrl(fullAvatarUrl);
        }
        
        fetchUserProfile(currentUser.id);
      }
    };
    
    refreshData();
  }, [navigate]);
  
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      const userData = await userService.getUserProfile(userId);
      
      if (userData) {
        // Cập nhật user state
        setUserDetails(userData);
        
        // Cập nhật form data
        setFormData({
          fullName: userData.fullName || userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || ''
        });
        
        // Cập nhật avatar URL từ userDetails nếu có
        if (userData.avatarUrl || userData.avatar_url) {
          const avatarUrl = userData.avatarUrl || userData.avatar_url;
          const fullAvatarUrl = userService.getFullAvatarUrl(avatarUrl);
          console.log('Avatar URL từ userDetails:', fullAvatarUrl);
          setPreviewUrl(fullAvatarUrl);
        }
        
        // Nếu là luật sư, lấy thêm thông tin chi tiết của luật sư
        if (user && user.role && user.role.toLowerCase() === 'lawyer') {
          try {
            const lawyerData = await userService.getLawyerById(userId);
            if (lawyerData) {
              console.log('Thông tin chi tiết luật sư:', lawyerData);
            }
          } catch (err) {
            console.error('Lỗi lấy thông tin chi tiết luật sư:', err);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi lấy thông tin profile:', error);
      setError('Không thể tải thông tin người dùng');
      setLoading(false);
    }
  };
  
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
      
      // Kiểm tra loại file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)');
        return;
      }
      
      // Kiểm tra kích thước file (giới hạn 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('Kích thước file không được vượt quá 2MB');
        return;
      }
      
      setAvatar(file);
      setError(''); // Xóa thông báo lỗi nếu có
      
      // Tạo URL preview ngay lập tức
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const result = event.target.result;
        setPreviewUrl(result);
        console.log('Preview URL updated:', result);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Cập nhật thông tin hồ sơ
      await userService.updateUserProfile(user.id, {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio
      });
      
      // Nếu có avatar mới, tải lên
      if (avatar) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatar);
        
        console.log('Đang tải lên avatar mới...');
        setAvatarLoading(true);
        try {
          const avatarResponse = await userService.uploadAvatar(user.id, formDataUpload);
          console.log('Kết quả tải lên avatar:', avatarResponse);
          
          if (avatarResponse && avatarResponse.data) {
            // Lấy URL avatar từ phản hồi
            let avatarUrl = avatarResponse.data.avatarUrl || '';
            
            // Chuyển thành URL đầy đủ nếu cần
            if (avatarUrl) {
              const fullAvatarUrl = userService.getFullAvatarUrl(avatarUrl);
              console.log('URL avatar đầy đủ:', fullAvatarUrl);
              
              // Cập nhật URL preview để hiển thị ngay
              setPreviewUrl(fullAvatarUrl);
              
              // Cập nhật URL vào user locals
              const updatedUser = JSON.parse(localStorage.getItem('user'));
              if (updatedUser) {
                updatedUser.avatarUrl = fullAvatarUrl;
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            }
          }
        } catch (avatarError) {
          console.error('Lỗi khi tải lên avatar:', avatarError);
          // Vẫn tiếp tục xử lý dù có lỗi avatar
        } finally {
          setAvatarLoading(false);
        }
      }
      
      // Cập nhật thông tin user trong localStorage
      await userService.refreshUserData();
      
      // Cập nhật lại user từ localStorage sau khi cập nhật
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      setSuccessMessage('Cập nhật hồ sơ thành công');
      setEditMode(false);
      
      // Làm mới thông tin profile
      fetchUserProfile(user.id);
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      setError(error.response?.data?.message || 'Lỗi cập nhật thông tin');
    } finally {
      setLoading(false);
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
    } catch (error) {
      setError(error.response?.data?.message || 'Mật khẩu hiện tại không chính xác');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Ngày không hợp lệ';
    }
  };
  
  if (loading && !user) {
    return <div className={styles.loading}>Đang tải thông tin người dùng...</div>;
  }
  
  if (!user) {
    return <div className={styles.error}>Không thể tải thông tin người dùng</div>;
  }

  // Kiểm tra yêu cầu mật khẩu
  const passwordRequirements = validatePassword(passwordData.newPassword);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const renderContent = () => {
    if (activeTab === 'appointments') {
      if (user && user.role && user.role.toLowerCase() === 'lawyer') {
        return <AppointmentsManager />;
      } else {
        return <AppointmentsPage />;
      }
    } else if (activeTab === 'password') {
      return <ChangePasswordPage />;
    } else if (activeTab === 'activity') {
      return (
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
            <a href="#" className={styles.activityLink} onClick={(e) => { e.preventDefault(); setActiveTab('appointments'); }}>
              <FaCalendarAlt /> Quản lý cuộc hẹn
            </a>
            <a href="#" className={styles.activityLink}>
              <FaUserCircle /> Lịch sử tư vấn
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.profileTab}>
          <div className={styles.sectionHeader}>
            <h2>Thông tin cá nhân</h2>
            {!editMode ? (
              <button 
                className={styles.editButton} 
                onClick={() => setEditMode(true)}
                disabled={avatarLoading}
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
                  onClick={() => {
                    setEditMode(false);
                    setError('');
                    // Đặt lại form về giá trị ban đầu
                    setFormData({
                      fullName: userDetails.fullName || userDetails.full_name || '',
                      phone: userDetails.phone || '',
                      address: userDetails.address || '',
                      bio: userDetails.bio || ''
                    });
                    // Đặt lại avatar preview nếu đã chọn file mới nhưng chưa lưu
                    if (avatar) {
                      setAvatar(null);
                      setPreviewUrl(user.avatarUrl || userDetails.avatarUrl || userDetails.avatar_url || '/default-avatar.png');
                    }
                  }}
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
      );
    }
  };

  return (
    <>
      <Navbar />
      <ChatManager />
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin cá nhân của bạn</p>
        </div>
        
        <div className={styles.content}>
          <div className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={`${styles.avatarWrapper} ${avatarLoading ? styles.avatarLoading : ''}`}>
                <img 
                  src={previewUrl || (user && user.avatarUrl && userService.getFullAvatarUrl(user.avatarUrl)) || '/default-avatar.png'} 
                  alt="Ảnh đại diện" 
                  className={styles.avatar}
                  onError={(e) => {
                    console.log('Lỗi tải ảnh, sử dụng ảnh mặc định');
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
                {editMode && !avatarLoading && (
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
                    <span>{formatDate(userDetails.createdAt || userDetails.created_at)}</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <FaHistory />
                  <div>
                    <p>Đăng nhập gần đây:</p>
                    <span>{formatDate(userDetails.lastLogin || userDetails.last_login)}</span>
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
                className={`${styles.menuItem} ${activeTab === 'appointments' ? styles.active : ''}`} 
                onClick={() => setActiveTab('appointments')}
              >
                <FaCalendarAlt /> Quản lý lịch hẹn
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
            
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;