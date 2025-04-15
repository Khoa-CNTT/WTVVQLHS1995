import React, { useState, useEffect, useCallback } from 'react';
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

  // Định nghĩa hàm fetchAvailability trước useEffect
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!lawyer || !lawyer.id) {
        console.error('ID luật sư không tồn tại:', lawyer);
        setError('Không thể lấy lịch khả dụng - ID luật sư không hợp lệ');
        setAvailabilitySlots([]);
        setLoading(false);
        return;
      }

      console.log('Đang lấy lịch trống cho luật sư ID:', lawyer.id);
      
      // Lấy khung giờ từ API
      const result = await appointmentService.getLawyerAvailability(lawyer.id);
      console.log('Dữ liệu khung giờ:', result);

      if (result && result.status === 'success' && Array.isArray(result.data)) {
        // Trước khi cập nhật state, xử lý dữ liệu để đánh dấu slot đã chọn nếu có
        const processedSlots = result.data.map(slot => {
          // Kiểm tra slot đã được đặt hay chưa
          const isBooked = slot.status === 'booked';
          // Kiểm tra xem có phải slot đang chọn không
          const isSelected = selectedSlot && 
            slot.start_time === selectedSlot.start_time && 
            slot.end_time === selectedSlot.end_time;

          return {
            ...slot,
            isBooked,
            isSelected
          };
        });

        setAvailabilitySlots(processedSlots);
      } else {
        // Xử lý trường hợp API trả về lỗi hoặc không có dữ liệu
        const errorMessage = (result && result.message) ? result.message : 'Không thể lấy lịch làm việc';
        console.error('Lỗi khi lấy lịch:', errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setAvailabilitySlots([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch khả dụng:', error);
      const errorMessage = error.message || 'Không thể lấy lịch khả dụng';
      setError(errorMessage);
      toast.error(errorMessage);
      setAvailabilitySlots([]);
    } finally {
      setLoading(false);
    }
  }, [lawyer, selectedSlot]);

  useEffect(() => {
    // Lấy thông tin người dùng đăng nhập
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    
    // Chỉ fetch lịch trống khi có ID của luật sư
    if (lawyer && lawyer.id) {
      console.log('Lấy lịch trống cho luật sư ID:', lawyer.id);
      fetchAvailability();
    } else {
      console.log('Không thể lấy lịch trống - thiếu ID luật sư');
    }
  }, [lawyer, fetchAvailability]);

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setDateSelected(true);
    setSelectedSlot(null);
  };

  const handleSlotSelection = (slot) => {
    // Kiểm tra xem slot có bị đánh dấu là không thể đặt không
    if (slot.isBooked) {
      toast.error('Khung giờ này đã được đặt bởi người khác');
      return;
    }
    
    // Kiểm tra slot có trạng thái 'booked' không
    if (slot.status === 'booked') {
      toast.error('Khung giờ này đã được đặt');
      return;
    }
    
    // Kiểm tra thời gian đã qua
    const now = new Date();
    const slotStart = new Date(slot.start_time);
    if (slotStart < now) {
      toast.error('Không thể đặt lịch cho thời gian đã qua');
      return;
    }
    
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
      toast.error('Vui lòng đăng nhập để đặt lịch');
      return;
    }
    
    if (!selectedSlot) {
      setError('Vui lòng chọn thời gian cho cuộc hẹn');
      toast.error('Vui lòng chọn thời gian cho cuộc hẹn');
      return;
    }

    // Kiểm tra lại một lần nữa về trạng thái slot
    if (isSlotDisabled(selectedSlot)) {
      setError('Khung giờ này đã được đặt');
      toast.error('Khung giờ này đã được đặt');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const appointmentData = {
        lawyer_id: lawyer.id,
        customer_id: currentUser.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        purpose: formData.purpose.trim(),
        status: 'pending'
      };
      
      console.log('Đang gửi dữ liệu đặt lịch:', appointmentData);
      
      const response = await appointmentService.createAppointment(appointmentData);
      console.log('Phản hồi từ createAppointment:', response);
      
      // Kiểm tra response có đúng định dạng không
      if (response && response.status === 'success') {
        toast.success('Đặt lịch hẹn thành công');
        if (onSuccess && response.data) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        // Đảm bảo luôn có thông báo lỗi
        const errorMessage = response && response.message 
          ? response.message 
          : 'Không thể đặt lịch hẹn';
        
        // Xử lý các lỗi cụ thể để hiển thị thông báo phù hợp
        if (errorMessage.includes('trùng') || 
            errorMessage.includes('đã đặt') || 
            errorMessage.includes('đã có người đặt') || 
            errorMessage.includes('không có sẵn')) {
          // Lỗi lịch trùng - cần làm mới danh sách slot để cập nhật
          setError('Khung giờ này đã được đặt bởi người khác. Vui lòng chọn thời gian khác.');
          toast.error('Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
          
          // Làm mới lại danh sách slot
          await fetchAvailability();
        } else {
          // Lỗi khác
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Lỗi khi đặt lịch hẹn:', error);
      const errorMsg = extractErrorMessage(error);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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

  // Hàm kiểm tra trạng thái slot để hiển thị CSS tương ứng
  const getSlotClassName = (slot) => {
    let baseClass = styles.timeSlot;
    
    if (selectedSlot && selectedSlot.id === slot.id) {
      baseClass += ` ${styles.selectedTimeSlot}`;
    }
    
    // Kiểm tra nếu slot đã được đánh dấu là đã đặt
    if (slot.status === 'booked' || slot.isBooked) {
      baseClass += ` ${styles.bookedTimeSlot}`;
    }
    
    return baseClass;
  };

  // Kiểm tra slot có thể đặt được không (dùng cho disabled attribute)
  const isSlotDisabled = (slot) => {
    // Slot đã được đặt trước thì không thể chọn
    if (slot.status === 'booked' || slot.isBooked) {
      return true;
    }
    
    // Thời gian đã qua thì không thể chọn
    const now = new Date();
    const slotStart = new Date(slot.start_time);
    
    if (slotStart < now) {
      return true;
    }
    
    // Mặc định, các slot khả dụng có thể chọn
    return false;
  };

  // Kiểm tra người dùng đã đăng nhập chưa
  const isLoggedIn = authService.isAuthenticated();

  return (
    <div className={styles.appointmentModal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Đặt lịch hẹn với {lawyer.full_name}</h3>
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
            <p>Hiện tại luật sư chưa có lịch trống nào</p>
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
                      className={getSlotClassName(slot)}
                      onClick={() => handleSlotSelection(slot)}
                      disabled={isSlotDisabled(slot)}
                      title={isSlotDisabled(slot) ? 'Đã được đặt' : 'Có thể đặt lịch'}
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
                      {(slot.status === 'booked' || slot.isBookable === false) && (
                        <span className={styles.slotStatus}> (Đã đặt)</span>
                      )}
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
                name="purpose"
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
                disabled={!selectedSlot || !formData.purpose.trim() || loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Xác nhận đặt lịch
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm; 