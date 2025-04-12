import { useState, useEffect } from 'react';
import userService from '../../services/userService';
import authService from '../../services/authService';

/**
 * Hook tùy chỉnh để lấy và quản lý thông tin hồ sơ người dùng
 * @returns {Object} Dữ liệu và hàm xử lý liên quan đến hồ sơ người dùng
 */
export const useProfile = () => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({
    lastLogin: null,
    createdAt: null,
    isLocked: false,
    failedAttempts: 0,
    isLawyer: false,
    lawyerDetails: null,
    stats: {
      documents: 0,
      cases: 0,
      appointments: 0,
      consultations: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    bio: ''
  });
  
  /**
   * Lấy thông tin người dùng từ API
   */
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      // Lấy thông tin từ localStorage trước
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      // Khởi tạo dữ liệu cơ bản
      setUser(currentUser);
      setFormData({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
        address: '',
        bio: ''
      });
      
      try {
        // Sau đó tải thông tin chi tiết từ API
        const userData = await userService.getUserProfile(userId || currentUser.id);
        
        if (!userData) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }
        
        // Cập nhật thông tin người dùng với dữ liệu đầy đủ
        setUser({
          ...userData,
          // Đảm bảo các trường cần thiết có giá trị
          id: userData.id,
          username: userData.username,
          email: userData.email,
          fullName: userData.full_name,
          phone: userData.phone || '',
          role: userData.role,
          isVerified: userData.is_verified,
          isLocked: userData.is_locked,
          lastLogin: userData.last_login,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          // Thông tin từ userprofiles
          address: userData.address || '',
          bio: userData.bio || '',
          avatarUrl: userData.avatar_url || '/default-avatar.png'
        });
        
        // Cập nhật form data
        setFormData({
          fullName: userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || ''
        });
        
        // Kiểm tra vai trò người dùng
        const isLawyer = userData.role && userData.role.toLowerCase() === 'lawyer';
        
        // Lấy thống kê người dùng
        let userStats;
        try {
          userStats = await userService.getUserStats(currentUser.id);
        } catch (statsError) {
          console.error('Lỗi lấy thống kê người dùng:', statsError);
          userStats = {
            documents: 0,
            cases: 0,
            appointments: 0,
            consultations: 0
          };
        }
        
        // Lấy thông tin luật sư nếu có vai trò luật sư
        let lawyerData = null;
        if (isLawyer) {
          try {
            lawyerData = await userService.getLawyerDetails(currentUser.id);
          } catch (lawyerError) {
            console.error('Lỗi lấy thông tin luật sư:', lawyerError);
            // Nếu có lỗi, sử dụng dữ liệu mặc định
            lawyerData = {
              certification: 'Chưa cập nhật',
              experienceYears: 0,
              specialization: 'Chưa cập nhật',
              rating: 0.0
            };
          }
        }
        
        // Cập nhật thông tin bổ sung
        setUserDetails({
          lastLogin: userData.last_login || null,
          createdAt: userData.created_at || null,
          isLocked: userData.is_locked || false,
          failedAttempts: userData.failed_attempts || 0,
          isLawyer: isLawyer,
          lawyerDetails: lawyerData,
          stats: userStats
        });
      } catch (apiError) {
        console.error('Lỗi tải API:', apiError);
        setError('Lỗi tải thông tin người dùng từ máy chủ');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải profile:', error);
      setError('Không thể tải thông tin người dùng');
      setLoading(false);
    }
  };
  
  /**
   * Cập nhật thông tin hồ sơ người dùng
   */
  const updateUserProfile = async (userData) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      if (!user || !user.id) {
        throw new Error('Không có thông tin người dùng để cập nhật');
      }
      
      // Lưu lại vai trò hiện tại trước khi cập nhật
      const currentRole = user.role;
      
      // Thêm vai trò vào dữ liệu cập nhật để đảm bảo không bị mất
      const updatedUserData = {
        ...userData,
        role: currentRole
      };
      
      const updatedUser = await userService.updateUserProfile(user.id, updatedUserData);
      
      // Cập nhật dữ liệu người dùng trong state và đảm bảo giữ nguyên vai trò
      setUser(prev => ({
        ...prev,
        ...updatedUser,
        role: currentRole // Đảm bảo vai trò được giữ nguyên
      }));
      
      // Cập nhật dữ liệu người dùng trong localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.fullName = userData.fullName || '';
        currentUser.phone = userData.phone || '';
        // Đảm bảo vai trò được giữ nguyên
        currentUser.role = currentRole;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      setSuccessMessage('Cập nhật hồ sơ thành công');
      setLoading(false);
      
      return updatedUser;
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      setError(error.message || 'Lỗi cập nhật hồ sơ người dùng');
      setLoading(false);
      throw error;
    }
  };
  
  /**
   * Tải lên ảnh đại diện
   */
  const uploadAvatar = async (formData) => {
    try {
      setLoading(true);
      setError('');
      
      if (!user || !user.id) {
        throw new Error('Không có thông tin người dùng');
      }
      
      const result = await userService.uploadAvatar(user.id, formData);
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Lỗi tải lên ảnh đại diện:', error);
      setError(error.message || 'Lỗi tải lên ảnh đại diện');
      setLoading(false);
      throw error;
    }
  };
  
  /**
   * Định dạng ngày tháng
   */
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'Chưa có dữ liệu';
    }
    
    try {
      const date = new Date(dateString);
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return 'Chưa có dữ liệu';
      }
      
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Lỗi định dạng ngày tháng:', error);
      return 'Chưa có dữ liệu';
    }
  };
  
  return {
    user,
    userDetails,
    formData,
    loading,
    error,
    successMessage,
    setUser,
    setUserDetails,
    setFormData,
    setLoading,
    setError,
    setSuccessMessage,
    fetchUserProfile,
    updateUserProfile,
    uploadAvatar,
    formatDate
  };
};

export default useProfile;
