import { useState, useEffect } from 'react';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';

/**
 * Hook tùy chỉnh để lấy và quản lý thông tin hồ sơ người dùng
 * @returns {Object} Dữ liệu và hàm xử lý liên quan đến hồ sơ người dùng
 */
export const useProfile = () => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatar, setAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUser(currentUser);
    fetchUserProfile(currentUser.id);
  }, [navigate]);
  
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      const userData = await userService.getUserProfile(userId);
        
      // Lấy thông tin cơ bản của user
      setUserDetails({
          ...userData,
        avatarUrl: userData.avatarUrl || '/default-avatar.png',
        bio: userData.bio || '',
        address: userData.address || '',
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLogin: userData.lastLogin || new Date().toISOString()
        });
        
      // Nếu là luật sư, lấy thêm thông tin luật sư
      if (user && user.role?.toLowerCase() === 'lawyer') {
        try {
          const lawyerData = await userService.getLawyerDetails(userId);
          setUserDetails(prevDetails => ({
            ...prevDetails,
            lawyerDetails: lawyerData
          }));
        } catch (error) {
          console.error('Lỗi lấy thông tin luật sư:', error);
        }
      }
      
      // Lấy thống kê người dùng
      try {
        const statsData = await userService.getUserStats(userId);
        setUserDetails(prevDetails => ({
          ...prevDetails,
          stats: statsData
        }));
      } catch (error) {
        console.error('Lỗi lấy thống kê người dùng:', error);
      }
      
      setLoading(false);
    } catch (error) {
      setError('Không thể tải thông tin người dùng');
      setLoading(false);
      console.error('Lỗi lấy thông tin profile:', error);
    }
  };
  
  const updateUserProfile = async (userData) => {
    try {
      setLoading(true);
      
      // Cập nhật thông tin cơ bản
      const updatedData = await userService.updateUserProfile(user.id, userData);
      
      // Cập nhật state user details
      setUserDetails(prevDetails => ({
        ...prevDetails,
        ...updatedData
      }));
      
      // Cập nhật avatar nếu có
      if (avatar) {
        await uploadUserAvatar();
      }
      
      setSuccessMessage('Cập nhật thông tin thành công');
      setIsEditing(false);
      setLoading(false);
      
      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Làm mới thông tin người dùng
      fetchUserProfile(user.id);
      
      return true;
    } catch (error) {
      setError(error.message || 'Lỗi cập nhật thông tin');
      setLoading(false);
      console.error('Lỗi cập nhật profile:', error);
      return false;
    }
  };
  
  const uploadUserAvatar = async () => {
    try {
      if (!avatar) return null;
      
      const formData = new FormData();
      formData.append('avatar', avatar);
      
      // Tạo config để theo dõi tiến trình upload
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };
      
      console.log('Sending avatar upload request for user ID:', user.id);
      
      const response = await userService.uploadAvatar(user.id, formData, config);
      
      console.log('Upload avatar response:', response);
      
      if (response) {
        // Lấy URL avatar từ response
        let avatarUrl = '';
        
        if (response.data && response.data.avatarUrl) {
          // Ưu tiên dùng avatarUrl (đường dẫn tương đối)
          avatarUrl = response.data.avatarUrl;
        } else if (response.data && response.data.fullAvatarUrl) {
          // Sử dụng fullAvatarUrl nếu có
          avatarUrl = response.data.fullAvatarUrl;
        } else if (response.avatarUrl) {
          // Fallback cho cấu trúc phản hồi khác
          avatarUrl = response.avatarUrl;
        }
        
        if (avatarUrl) {
          console.log('Cập nhật avatar URL mới:', avatarUrl);
          
          // Chuyển đổi URL tương đối thành URL đầy đủ
          const fullAvatarUrl = userService.getFullAvatarUrl(avatarUrl);
          console.log('Full avatar URL:', fullAvatarUrl);
          
          // Cập nhật trong state
          setUserDetails(prevDetails => ({
            ...prevDetails,
            avatarUrl: fullAvatarUrl || avatarUrl
          }));
          
          // Cập nhật vào localStorage để hiển thị ngay
          const currentUser = JSON.parse(localStorage.getItem('user'));
          if (currentUser) {
            currentUser.avatarUrl = fullAvatarUrl || avatarUrl;
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
          
          // Hiển thị thông báo thành công
          setSuccessMessage('Cập nhật ảnh đại diện thành công');

          // Làm mới thông tin để đảm bảo dữ liệu mới
          setTimeout(() => {
            fetchUserProfile(user.id);
          }, 500);
        } else {
          // Nếu không tìm thấy URL, sử dụng preview làm fallback
          setUserDetails(prevDetails => ({
            ...prevDetails,
            avatarUrl: previewAvatar
          }));
        }
        
        // Reset state
        setAvatar(null);
        setPreviewAvatar(null);
        setUploadProgress(0);
        
        return response;
      }
      
      return null;
    } catch (error) {
      console.error('Lỗi chi tiết khi upload avatar:', error);
      setError(error.message || 'Không thể tải lên ảnh đại diện');
      setUploadProgress(0);
      return null;
    }
  };
  
  const handleAvatarChange = (file) => {
    if (!file) return;
    
    setAvatar(file);
  
    // Tạo preview URL cho avatar mới
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewAvatar(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
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
  
  return {
    user,
    userDetails,
    loading,
    error,
    isEditing,
    setIsEditing,
    avatar,
    previewAvatar,
    uploadProgress,
    successMessage,
    setSuccessMessage,
    setError,
    fetchUserProfile,
    updateUserProfile,
    uploadUserAvatar,
    handleAvatarChange,
    formatDate
  };
};

export default useProfile;
