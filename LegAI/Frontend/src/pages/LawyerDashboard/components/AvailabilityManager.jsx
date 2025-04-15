import React, { useState, useEffect } from 'react';
import styles from './AvailabilityManager.module.css';
import appointmentService from '../../../services/appointmentService';
import authService from '../../../services/authService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AvailabilityManager = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    start_time: '',
    end_time: ''
  });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          toast.error('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
          navigate('/login');
          return;
        }

        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          
          // Kiểm tra role không phân biệt chữ hoa chữ thường
          if (!user.role || typeof user.role !== 'string' || (user.role.toLowerCase() !== 'lawyer')) {
            toast.error('Bạn không có quyền truy cập trang này. Chỉ luật sư mới có thể quản lý lịch.');
            navigate('/dashboard');
            return;
          }

          await fetchAvailabilities(user.id);
        } catch (error) {
          console.error('Lỗi khi xử lý dữ liệu người dùng:', error);
          toast.error('Có lỗi xảy ra khi xác thực người dùng.');
          navigate('/login');
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const fetchAvailabilities = async (lawyerId) => {
    if (!lawyerId) {
      console.error('Không có ID luật sư để lấy lịch trống');
      return;
    }
    
    try {
      setLoading(true);
      const response = await appointmentService.getLawyerAvailability(lawyerId);
      
      console.log('Response từ getLawyerAvailability:', response);
      
      if (response && response.status === 'success') {
        if (Array.isArray(response.data)) {
          console.log('Đã lấy lịch trống:', response.data.length);
          console.log('Chi tiết lịch trống:', response.data);
          setAvailabilities(response.data);
        } else {
          console.log('Dữ liệu không phải mảng:', response.data);
          setAvailabilities([]);
        }
      } else {
        console.log('Không có lịch trống hoặc phản hồi không đúng định dạng:', response);
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch trống:', error);
      handleApiError(error, 'Không thể lấy danh sách lịch trống');
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModalOpen = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0, 0, 0);

    setNewAvailability({
      start_time: tomorrow.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16)
    });
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    setError('');
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setNewAvailability(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApiError = (error, customMessage = 'Đã xảy ra lỗi') => {
    console.error('Chi tiết lỗi:', error);
    
    if (error.code === 403 || error.response?.status === 403) {
      const errorMessage = error.message || error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này';
      toast.error(`Lỗi phân quyền: ${errorMessage}`);
      
      // Kiểm tra xem lỗi có liên quan đến token hết hạn không
      if (errorMessage.includes('token') || errorMessage.includes('đăng nhập lại')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
      return;
    }
    
    if (error.code === 401 || error.response?.status === 401) {
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    // Hiển thị thông báo lỗi từ response nếu có, nếu không sử dụng thông báo tùy chỉnh
    const errorMessage = error.message || error.response?.data?.message || customMessage;
    toast.error(errorMessage);
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    
    try {
      // Kiểm tra người dùng đăng nhập
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        setError("Không thể xác định ID luật sư. Vui lòng đăng nhập lại.");
        return;
      }
      
      // Validate dữ liệu
      if (!newAvailability.start_time || !newAvailability.end_time) {
        setError("Vui lòng chọn thời gian bắt đầu và kết thúc");
        return;
      }
      
      // Kiểm tra thời gian hợp lệ
      const startTime = new Date(newAvailability.start_time);
      const endTime = new Date(newAvailability.end_time);
      
      if (startTime >= endTime) {
        setError("Thời gian kết thúc phải sau thời gian bắt đầu");
        return;
      }
      
      const now = new Date();
      if (startTime < now) {
        setError("Không thể thêm lịch trống cho thời gian đã qua");
        return;
      }
      
      // Chuẩn bị dữ liệu
      const availabilityData = {
        ...newAvailability,
        lawyer_id: user.id
      };
      
      // Gọi API thêm lịch trống
      setLoading(true);
      const response = await appointmentService.addAvailability(availabilityData);
      
      if (response.success) {
        // Thêm thành công
        setSuccessMessage('Đã thêm lịch trống thành công!');
        setTimeout(() => setSuccessMessage(''), 5000);
        
        // Đóng modal và làm mới danh sách
        setShowAddModal(false);
        resetNewAvailability();
        await fetchAvailabilities(user.id);
      } else {
        // Xử lý lỗi
        let errorMessage = response.message || 'Không thể thêm lịch trống';
        
        // Nếu là lỗi trùng lịch từ server, đưa ra thông báo cụ thể
        if (response.message && response.message.includes('trùng')) {
          errorMessage = 'Lịch trống đã tồn tại trong cơ sở dữ liệu. Vui lòng kiểm tra lại.';
        }
        
        handleApiError(response, errorMessage);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    if (!availabilityId || !window.confirm('Bạn có chắc chắn muốn xóa lịch trống này?')) {
      return;
    }

    try {
      const response = await appointmentService.deleteAvailability(availabilityId);
      if (response.status === 'success') {
        if (currentUser?.id) {
          await fetchAvailabilities(currentUser.id);
        }
        toast.success('Xóa lịch trống thành công');
      } else {
        throw new Error(response.message || 'Không thể xóa lịch trống');
      }
    } catch (error) {
      console.error('Lỗi khi xóa lịch trống:', error);
      toast.error(error.message || 'Không thể xóa lịch trống');
    }
  };

  const handleGenerateWeeklySchedule = async () => {
    try {
      setGeneratingSchedule(true);
      
      // Lấy ngày hiện tại
      const currentDate = new Date();
      
      // Ngày bắt đầu tạo lịch là ngày hiện tại + 2 ngày
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + 2);
      startDate.setHours(8, 0, 0, 0);
      
      // Tạo các slot cho 5 ngày làm việc tiếp theo
      const slots = [];
      
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayOffset);
        
        // Slot buổi sáng (8:00 - 12:00)
        const morningStart = new Date(date);
        morningStart.setHours(8, 0, 0, 0);
        
        const morningEnd = new Date(date);
        morningEnd.setHours(12, 0, 0, 0);
        
        // Slot buổi chiều (13:00 - 17:00)
        const afternoonStart = new Date(date);
        afternoonStart.setHours(13, 0, 0, 0);
        
        const afternoonEnd = new Date(date);
        afternoonEnd.setHours(17, 0, 0, 0);
        
        // Thêm vào danh sách slot
        slots.push({
          lawyer_id: currentUser.id,
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          status: 'available',
          user_role: 'lawyer'
        });
        
        slots.push({
          lawyer_id: currentUser.id,
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          status: 'available',
          user_role: 'lawyer'
        });
      }
      
      // Kiểm tra các slot đã tồn tại
      const existingAvailabilities = await appointmentService.getLawyerAvailability(currentUser.id);
      
      // Lọc bỏ các slot trùng lặp
      const uniqueSlots = slots.filter(newSlot => {
        const newSlotStart = new Date(newSlot.start_time);
        const newSlotEnd = new Date(newSlot.end_time);
        
        // Kiểm tra xem slot mới có trùng với slot đã tồn tại không
        return !existingAvailabilities.data.some(existingSlot => {
          const existingSlotStart = new Date(existingSlot.start_time);
          const existingSlotEnd = new Date(existingSlot.end_time);
          
          // Kiểm tra điều kiện trùng lặp
          return (
            (newSlotStart <= existingSlotEnd && newSlotEnd >= existingSlotStart)
          );
        });
      });
      
      // Nếu không có slot mới nào cần thêm
      if (uniqueSlots.length === 0) {
        toast.info('Tất cả các slot trong tuần đã được tạo');
        setGeneratingSchedule(false);
        return;
      }
      
      // Thêm các slot mới
      let addedCount = 0;
      for (const slot of uniqueSlots) {
        try {
          await appointmentService.addAvailability(slot);
          addedCount++;
        } catch (error) {
          console.error('Lỗi khi thêm slot:', error);
        }
      }
      
      toast.success(`Đã tạo ${addedCount} khung giờ làm việc trong tuần`);
      fetchAvailabilities(currentUser.id); // Cập nhật danh sách
    } catch (error) {
      handleApiError(error);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const formatDateTime = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Nhóm các lịch trống theo ngày
  const groupAvailabilitiesByDate = () => {
    const grouped = {};
    if (Array.isArray(availabilities)) {
      availabilities.forEach(availability => {
        const date = new Date(availability.start_time).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(availability);
      });

      // Sắp xếp các slot theo thời gian
      Object.values(grouped).forEach(slots => {
        slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      });
    }
    return grouped;
  };

  const resetNewAvailability = () => {
    setNewAvailability({
      start_time: '',
      end_time: ''
    });
  };

  return (
    <div className={styles.availabilityManager}>
      <div className={styles.header}>
        <div className={styles.actionButtons}>
          <button className={styles.addButton} onClick={handleAddModalOpen}>
            <i className="fas fa-plus"></i> Thêm lịch trống
          </button>
          <button className={styles.generateButton} onClick={handleGenerateWeeklySchedule}>
            <i className="fas fa-calendar"></i> Tạo lịch tự động
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i> Đang tải...
        </div>
      ) : !Array.isArray(availabilities) || availabilities.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-calendar-times"></i>
          <p>Chưa có lịch trống nào được tạo</p>
        </div>
      ) : (
        <div className={styles.calendarView}>
          {Object.entries(groupAvailabilitiesByDate()).map(([date, slots]) => (
            <div key={date} className={styles.dayCard}>
              <div className={styles.dayHeader}>
                <h4>{new Date(date).toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</h4>
              </div>
              <div className={styles.timeSlotList}>
                {slots.map((slot) => (
                  <div key={`${slot.id || ''}-${slot.start_time}-${slot.end_time}`} className={styles.timeSlot}>
                    <span className={styles.timeRange}>
                      {new Date(slot.start_time).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} 
                      {' - '}
                      {new Date(slot.end_time).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteAvailability(slot.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Thêm lịch trống mới</h3>
              <button className={styles.closeButton} onClick={handleAddModalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddAvailability} className={styles.modalForm}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
              <div className={styles.formGroup}>
                <label>Thời gian bắt đầu:</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={newAvailability.start_time}
                  onChange={handleAvailabilityChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Thời gian kết thúc:</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={newAvailability.end_time}
                  onChange={handleAvailabilityChange}
                  min={newAvailability.start_time}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveButton}>
                  <i className="fas fa-save"></i> Lưu
                </button>
                <button type="button" className={styles.cancelButton} onClick={handleAddModalClose}>
                  <i className="fas fa-times"></i> Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager; 