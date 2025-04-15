import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Lawyers.module.css';
import appointmentService from '../../../services/appointmentService';
import authService from '../../../services/authService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const AppointmentForm = ({ lawyer, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
    notes: ''
  });

  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateSelected, setDateSelected] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    if (lawyer && lawyer.id) {
      fetchAvailability();
    }
  }, [lawyer]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getLawyerAvailability(lawyer.id);
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        // Nhóm các slot theo ngày và sắp xếp
        const slots = response.data
          .filter(slot => new Date(slot.start_time) > new Date())
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        setAvailabilitySlots(slots);
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy lịch trống:', error);
      setError('Không thể lấy thông tin lịch trống');
      setLoading(false);
    }
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setDateSelected(true);
    setSelectedSlot(null);
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const extractErrorMessage = (error) => {
    if (typeof error === 'string' && error.includes('Error:')) {
      const match = error.match(/Error: (.*?)<br>/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Không thể đặt lịch hẹn. Vui lòng thử lại sau.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Vui lòng đăng nhập để đặt lịch');
      return;
    }
    
    if (!selectedSlot) {
      setError('Vui lòng chọn thời gian cho cuộc hẹn');
      return;
    }
    
    try {
      const appointmentData = {
        lawyer_id: lawyer.id,
        customer_id: currentUser.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        purpose: formData.purpose.trim(),
        status: 'pending'
      };
      
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.status === 'success') {
        toast.success('Đặt lịch hẹn thành công');
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        throw new Error(response.message || 'Không thể đặt lịch hẹn');
      }
    } catch (error) {
      console.error('Lỗi khi đặt lịch hẹn:', error);
      setError(error.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại sau.');
    }
  };

  // Nhóm các slot theo ngày
  const groupSlotsByDate = () => {
    const grouped = {};
    availabilitySlots.forEach(slot => {
      const date = new Date(slot.start_time).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate();
  const availableDates = Object.keys(groupedSlots);

  // Kiểm tra người dùng đã đăng nhập chưa
  const isLoggedIn = authService.isAuthenticated();

  return (
    <div className={styles.appointmentModal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Đặt lịch hẹn với {lawyer.full_name}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {!isLoggedIn ? (
          <div className={styles.loginRequired}>
            <i className="fas fa-exclamation-circle"></i>
            <p>Vui lòng đăng nhập để đặt lịch hẹn</p>
            <a href="/login" className={styles.loginButton}>
              <i className="fas fa-sign-in-alt"></i> Đăng nhập
            </a>
          </div>
        ) : loading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i> Đang tải...
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        ) : availableDates.length === 0 ? (
          <div className={styles.noAvailabilityWarning}>
            <i className="fas fa-calendar-times"></i>
            <p>Hiện tại luật sư chưa có lịch trống</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.appointmentForm}>
            <div className={styles.formSection}>
              <h4>Chọn ngày:</h4>
              <div className={styles.dateList}>
                {availableDates.map(date => (
                  <button
                    key={date}
                    type="button"
                    className={`${styles.dateButton} ${selectedDate === date ? styles.selectedDate : ''}`}
                    onClick={() => handleDateSelection(date)}
                  >
                    {new Date(date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className={styles.formSection}>
                <h4>Chọn giờ:</h4>
                <div className={styles.timeSlotList}>
                  {groupedSlots[selectedDate].map(slot => (
                    <button
                      key={`${slot.id}-${slot.start_time}`}
                      type="button"
                      className={`${styles.timeSlot} ${selectedSlot === slot ? styles.selectedTimeSlot : ''}`}
                      onClick={() => handleSlotSelection(slot)}
                    >
                      {new Date(slot.start_time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(slot.end_time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Mục đích tư vấn:</label>
              <textarea
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Nhập mục đích tư vấn của bạn..."
                required
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                <i className="fas fa-times"></i> Hủy
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!selectedSlot || !formData.purpose.trim()}
              >
                <i className="fas fa-check"></i> Xác nhận đặt lịch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm; 