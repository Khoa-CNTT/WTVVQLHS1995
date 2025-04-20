import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEye, FaEyeSlash, FaKey, FaFileAlt, FaUserCircle, FaPen, FaUpload, FaCalendarAlt, FaHistory, FaBalanceScale, FaStar, FaBookmark } from 'react-icons/fa';
import styles from './Profile.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import authService from '../../services/authService';
import userService from '../../services/userService';
import legalService from '../../services/legalService';
import ChangePasswordPage from './ChangePassword/ChangePasssword';
import ChatManager from '../../components/layout/Chat/ChatManager';
import AppointmentsPage from './Appointments/AppointmentsPage';
import AppointmentsManager from '../../pages/LawyerDashboard/components/AppointmentsManager';
import ContactForm from '../Contact/ContactForm';

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
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);
  const [bookmarkedDocuments, setBookmarkedDocuments] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  
  // Thêm state cho phân trang
  const [currentFavoritePage, setCurrentFavoritePage] = useState(1);
  const [currentBookmarkPage, setCurrentBookmarkPage] = useState(1);
  const itemsPerPage = 5;

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
    // Tải danh sách yêu thích và đánh dấu
    loadFavoritesAndBookmarks();
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

  // Thêm hàm tải danh sách yêu thích và đánh dấu
  const loadFavoritesAndBookmarks = async () => {
    try {
      setCollectionLoading(true);
      // Lấy ID từ localStorage
      const favoritesIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      const bookmarksIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      setFavorites(favoritesIds);
      setBookmarks(bookmarksIds);
      
      // Lấy thông tin chi tiết của các văn bản yêu thích
      const favoriteDocsData = [];
      for (const id of favoritesIds) {
        try {
          const response = await legalService.getLegalDocumentById(id);
          if (response.status === 'success' && response.data) {
            favoriteDocsData.push(response.data);
          }
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin văn bản yêu thích ${id}:`, error);
        }
      }
      setFavoriteDocuments(favoriteDocsData);
      
      // Lấy thông tin chi tiết của các văn bản đánh dấu
      const bookmarkedDocsData = [];
      for (const id of bookmarksIds) {
        try {
          const response = await legalService.getLegalDocumentById(id);
          if (response.status === 'success' && response.data) {
            bookmarkedDocsData.push(response.data);
          }
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin văn bản đánh dấu ${id}:`, error);
        }
      }
      setBookmarkedDocuments(bookmarkedDocsData);
      
      // Reset về trang đầu tiên sau khi tải lại dữ liệu
      setCurrentFavoritePage(1);
      setCurrentBookmarkPage(1);
    } catch (error) {
      console.error('Lỗi khi tải danh sách yêu thích và đánh dấu:', error);
    } finally {
      setCollectionLoading(false);
    }
  };

  // Thêm hàm xử lý phân trang
  const handleFavoritePageChange = (page) => {
    setCurrentFavoritePage(page);
  };
  
  const handleBookmarkPageChange = (page) => {
    setCurrentBookmarkPage(page);
  };

  // Thêm hàm xóa khỏi yêu thích
  const removeFromFavorites = (documentId) => {
    const updatedFavorites = favorites.filter(id => id !== documentId);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
    setFavoriteDocuments(favoriteDocuments.filter(doc => doc.id !== documentId));
  };

  // Thêm hàm xóa khỏi đánh dấu
  const removeFromBookmarks = (documentId) => {
    const updatedBookmarks = bookmarks.filter(id => id !== documentId);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    setBookmarks(updatedBookmarks);
    setBookmarkedDocuments(bookmarkedDocuments.filter(doc => doc.id !== documentId));
  };

  if (loading && !user) {
    return (
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonAvatar}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
      </div>
    );
  }

  // Kiểm tra yêu cầu mật khẩu
  const passwordRequirements = validatePassword(passwordData.newPassword);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const sections = [
    { id: 'personal-info', label: 'Thông tin cá nhân', icon: 'user' },
    { id: 'documents', label: 'Tài liệu', icon: 'file-alt' },
    { id: 'appointments', label: 'Cuộc hẹn', icon: 'calendar-alt' },
    { id: 'transactions', label: 'Lịch sử giao dịch', icon: 'money-bill-wave' },
    { id: 'password', label: 'Đổi mật khẩu', icon: 'lock' },
    { id: 'contact', label: 'Liên hệ hỗ trợ', icon: 'phone-alt' },
    { id: 'delete-account', label: 'Xóa tài khoản', icon: 'trash-alt', className: styles.dangerSection }
  ];

  // Hàm tạo phân trang
  const renderPagination = (totalItems, currentPage, onPageChange) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    const paginationItems = [];
    
    // Nút Previous
    paginationItems.push(
      <button 
        key="prev" 
        className={styles.paginationButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>
    );
    
    // Hiển thị tối đa 5 nút phân trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <button
          key={i}
          className={`${styles.paginationButton} ${currentPage === i ? styles.active : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    // Nút Next
    paginationItems.push(
      <button 
        key="next" 
        className={styles.paginationButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    );
    
    return <div className={styles.pagination}>{paginationItems}</div>;
  };
  
  // Tính toán dữ liệu được phân trang
  const getPaginatedData = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

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
            <a href="#" className={styles.activityLink} onClick={(e) => { e.preventDefault(); setActiveTab('collection'); }}>
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
    } else if (activeTab === 'collection') {
      // Phân trang cho dữ liệu
      const paginatedFavorites = getPaginatedData(favoriteDocuments, currentFavoritePage);
      const paginatedBookmarks = getPaginatedData(bookmarkedDocuments, currentBookmarkPage);
      
      return (
        <div className={styles.collectionTab}>
          <div className={styles.sectionHeader}>
            <h2>Bộ sưu tập tài liệu</h2>
            <button className={styles.refreshButton} onClick={loadFavoritesAndBookmarks} disabled={collectionLoading}>
              {collectionLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          
          {/* Phần yêu thích */}
          <div className={styles.collectionSection}>
            <h3>
              <FaStar className={styles.collectionIcon} /> 
              Văn bản yêu thích 
              <span className={styles.documentCount}>({favoriteDocuments.length})</span>
            </h3>
            
            {collectionLoading ? (
              <div className={styles.loadingMessage}>Đang tải danh sách văn bản yêu thích...</div>
            ) : favoriteDocuments.length > 0 ? (
              <>
                <div className={styles.documentsList}>
                  {paginatedFavorites.map(doc => (
                    <div key={doc.id} className={styles.documentItem}>
                      <div className={styles.documentInfo}>
                        <Link to={`/documents/${doc.id}`} className={styles.documentTitle}>
                          {doc.title}
                        </Link>
                        <div className={styles.documentMeta}>
                          <span className={styles.documentType}>{doc.document_type}</span>
                          {doc.issued_date && (
                            <span className={styles.documentDate}>
                              Ban hành: {formatDate(doc.issued_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.documentActions}>
                        <button 
                          className={styles.removeButton} 
                          onClick={() => removeFromFavorites(doc.id)}
                          title="Xóa khỏi danh sách yêu thích"
                        >
                          <FaStar /> Bỏ yêu thích
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Thêm phân trang cho văn bản yêu thích */}
                {renderPagination(favoriteDocuments.length, currentFavoritePage, handleFavoritePageChange)}
              </>
            ) : (
              <div className={styles.emptyMessage}>
                Bạn chưa có văn bản yêu thích nào. 
                <Link to="/documents" className={styles.browseLink}>Duyệt văn bản</Link>
              </div>
            )}
          </div>
          
          {/* Phần đánh dấu */}
          <div className={styles.collectionSection}>
            <h3>
              <FaBookmark className={styles.collectionIcon} /> 
              Văn bản đã đánh dấu
              <span className={styles.documentCount}>({bookmarkedDocuments.length})</span>
            </h3>
            
            {collectionLoading ? (
              <div className={styles.loadingMessage}>Đang tải danh sách văn bản đánh dấu...</div>
            ) : bookmarkedDocuments.length > 0 ? (
              <>
                <div className={styles.documentsList}>
                  {paginatedBookmarks.map(doc => (
                    <div key={doc.id} className={styles.documentItem}>
                      <div className={styles.documentInfo}>
                        <Link to={`/documents/${doc.id}`} className={styles.documentTitle}>
                          {doc.title}
                        </Link>
                        <div className={styles.documentMeta}>
                          <span className={styles.documentType}>{doc.document_type}</span>
                          {doc.issued_date && (
                            <span className={styles.documentDate}>
                              Ban hành: {formatDate(doc.issued_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.documentActions}>
                        <button 
                          className={styles.removeButton} 
                          onClick={() => removeFromBookmarks(doc.id)}
                          title="Xóa khỏi danh sách đánh dấu"
                        >
                          <FaBookmark /> Bỏ đánh dấu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Thêm phân trang cho văn bản đánh dấu */}
                {renderPagination(bookmarkedDocuments.length, currentBookmarkPage, handleBookmarkPageChange)}
              </>
            ) : (
              <div className={styles.emptyMessage}>
                Bạn chưa có văn bản đánh dấu nào. 
                <Link to="/documents" className={styles.browseLink}>Duyệt văn bản</Link>
              </div>
            )}
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
                <FaPen className="animate__animated animate__pulse animate__infinite" /> Chỉnh sửa
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

  const renderContact = () => (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Liên hệ hỗ trợ</h2>
      <p className={styles.sectionDescription}>
        Gửi thông tin liên hệ đến bộ phận hỗ trợ của LegAI.
      </p>
      <div className={styles.contactWrapper}>
        <ContactForm />
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <ChatManager />
      <div className={styles.profileContainer}>
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
              <h2>{user?.fullName || user?.username}</h2>
              <div className={styles.userRole}>
                <FaBalanceScale />
                <span>{user?.role || 'Người dùng'}</span>
              </div>

              <div className={styles.userStats}>
                <div className={styles.statItem}>
                  <div>
                    <p>Tham gia:</p>
                    <span>{formatDate(userDetails.createdAt || userDetails.created_at)}</span>
                  </div>
                </div>
                <div className={styles.statItem}>
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
                className={`${styles.menuItem} ${activeTab === 'collection' ? styles.active : ''}`}
                onClick={() => setActiveTab('collection')}
              >
                <FaFileAlt /> Bộ sưu tập
              </button>
              <button
                className={`${styles.menuItem} ${activeTab === 'activity' ? styles.active : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <FaHistory /> Hoạt động
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
            </div>
          </div>

          <div className={`${styles.mainContent} animate__animated animate__fadeIn`}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
            {activeTab === 'contact' ? renderContact() : renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;