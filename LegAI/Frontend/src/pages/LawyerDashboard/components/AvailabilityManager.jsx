import React, { useState, useEffect } from 'react';
import styles from './AvailabilityManager.module.css';
import appointmentService from '../../../services/appointmentService';
import authService from '../../../services/authService';
import { toast } from 'react-toastify';

const AvailabilityManager = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    start_time: '',
    end_time: ''
  });
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await fetchAvailabilities(user.id);
        } else {
          toast.error('Vui lòng đăng nhập lại');
        }
      } catch (err) {
        console.error('Lỗi khởi tạo:', err);
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
      }
    };
    init();
  }, []);

  const fetchAvailabilities = async (lawyerId) => {
    if (!lawyerId) return;
    
    try {
      setLoading(true);
      const response = await appointmentService.getLawyerAvailability(lawyerId);
      if (response && Array.isArray(response.data)) {
        setAvailabilities(response.data);
      } else {
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch trống:', error);
      toast.error('Không thể lấy danh sách lịch trống');
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

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    try {
      const startTime = new Date(newAvailability.start_time);
      const endTime = new Date(newAvailability.end_time);

      if (startTime >= endTime) {
        setError('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      if (startTime < new Date()) {
        setError('Không thể thêm lịch trống cho thời gian đã qua');
        return;
      }

      const availabilityData = {
        lawyer_id: currentUser.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'available'
      };

      const response = await appointmentService.addAvailability(availabilityData);
      if (response.status === 'success') {
        await fetchAvailabilities(currentUser.id);
        setShowAddModal(false);
        toast.success('Thêm lịch trống thành công');
      } else {
        throw new Error(response.message || 'Không thể thêm lịch trống');
      }
    } catch (error) {
      console.error('Lỗi khi thêm lịch trống:', error);
      setError(error.message || 'Không thể thêm lịch trống');
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

  const generateWeeklySchedule = async () => {
    if (!currentUser?.id) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    try {
      const now = new Date();
      const daysToGenerate = 7;
      const generatedSlots = [];

      for (let i = 1; i <= daysToGenerate; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        // Bỏ qua ngày chủ nhật
        if (date.getDay() === 0) continue;

        // Tạo 2 slot mỗi ngày: sáng và chiều
        const morningStart = new Date(date);
        morningStart.setHours(8, 0, 0, 0);
        const morningEnd = new Date(date);
        morningEnd.setHours(12, 0, 0, 0);
        
        const afternoonStart = new Date(date);
        afternoonStart.setHours(13, 30, 0, 0);
        const afternoonEnd = new Date(date);
        afternoonEnd.setHours(17, 30, 0, 0);

        generatedSlots.push(
          {
            lawyer_id: currentUser.id,
            start_time: morningStart.toISOString(),
            end_time: morningEnd.toISOString(),
            status: 'available'
          },
          {
            lawyer_id: currentUser.id,
            start_time: afternoonStart.toISOString(),
            end_time: afternoonEnd.toISOString(),
            status: 'available'
          }
        );
      }

      let successCount = 0;
      let errorCount = 0;

      for (const slot of generatedSlots) {
        try {
          const response = await appointmentService.addAvailability(slot);
          if (response.status === 'success') {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Lỗi khi thêm slot:', error);
          errorCount++;
          continue;
        }
      }

      await fetchAvailabilities(currentUser.id);
      
      if (successCount > 0) {
        toast.success(`Đã tạo ${successCount} khung giờ làm việc cho tuần tới`);
      }
      if (errorCount > 0) {
        toast.warning(`Có ${errorCount} khung giờ không thể tạo do trùng lặp`);
      }
    } catch (error) {
      console.error('Lỗi khi tạo lịch trống:', error);
      toast.error('Không thể tạo lịch trống tự động');
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

  return (
    <div className={styles.availabilityManager}>
      <div className={styles.header}>
        <h2>Quản lý lịch trống</h2>
        <div className={styles.actionButtons}>
          <button className={styles.addButton} onClick={handleAddModalOpen}>
            <i className="fas fa-plus"></i> Thêm lịch trống
          </button>
          <button className={styles.generateButton} onClick={generateWeeklySchedule}>
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